#!/usr/bin/env python3
"""Build src/data/dfw-markets.json for the branch-analysis worked example.

Public sources only:
  - FDIC Summary of Deposits (branch deposits, June 30), api.fdic.gov
  - U.S. Census Bureau county population estimates (April 2020 base to July of the vintage year)
  - American Community Survey households and median household income (latest release), via Census Reporter

Re-run after FDIC publishes a new Summary of Deposits (each fall):
    python3 scripts/build-dfw-markets.py
"""
import collections
import csv
import io
import json
import statistics
import urllib.parse
import urllib.request
from pathlib import Path

SOD_YEAR, SOD_BASE_YEAR = 2026, 2021
POP_VINTAGE = 2025
COUNTIES = {'Collin': '085', 'Ellis': '139', 'Kaufman': '257'}
# A single branch holding more than this is treated as booked (headquarters or corporate) rather than local.
BOOKED_THRESHOLD = 1_500_000  # $ thousands
COMMUNITY_ASSETS = 10_000_000  # $ thousands: community bank = under $10 billion in assets
UA = {'User-Agent': 'pauldrago.com market research'}
OUT = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'dfw-markets.json'


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA)).read()


def sod(county, year):
    rows, offset = [], 0
    while True:
        q = urllib.parse.urlencode({
            'filters': f'STALPBR:TX AND CNTYNAMB:"{county}" AND YEAR:{year}',
            'fields': 'NAMEFULL,DEPSUMBR,CITYBR,CERT,ASSET',
            'limit': 10000, 'offset': offset, 'format': 'json',
        })
        d = json.loads(get(f'https://api.fdic.gov/banks/sod?{q}'))
        rows += [r['data'] for r in d['data']]
        if len(rows) >= d['meta']['total'] or not d['data']:
            return rows
        offset += 10000


def local(rows):
    return [r for r in rows if r['DEPSUMBR'] < BOOKED_THRESHOLD]


pop = {}
popcsv = get(f'https://www2.census.gov/programs-surveys/popest/datasets/2020-{POP_VINTAGE}/counties/totals/co-est{POP_VINTAGE}-alldata.csv').decode('latin-1')
for r in csv.DictReader(io.StringIO(popcsv)):
    if r['STATE'] == '48' and r['COUNTY'] in COUNTIES.values():
        pop[r['COUNTY']] = (int(r['ESTIMATESBASE2020']), int(r[f'POPESTIMATE{POP_VINTAGE}']))

geo = ','.join('05000US48' + f for f in COUNTIES.values())
acs_raw = json.loads(get(f'https://api.censusreporter.org/1.0/data/show/latest?table_ids=B11001,B19013&geo_ids={geo}'))
acs_release = acs_raw['release']['name']
acs = {gid[-3:]: v for gid, v in acs_raw['data'].items()}

markets = []
for name, fips in COUNTIES.items():
    now, then = local(sod(name, SOD_YEAR)), local(sod(name, SOD_BASE_YEAR))
    dep_now, dep_then = sum(r['DEPSUMBR'] for r in now), sum(r['DEPSUMBR'] for r in then)
    by_bank = collections.Counter()
    for r in now:
        by_bank[r['NAMEFULL']] += r['DEPSUMBR']
    shares = sorted(((v / dep_now, k) for k, v in by_bank.items()), reverse=True)
    comm_now = [r for r in now if r['ASSET'] < COMMUNITY_ASSETS]
    comm_then = [r for r in then if r['ASSET'] < COMMUNITY_ASSETS]
    households = acs[fips]['B11001']['estimate']['B11001001']
    markets.append({
        'county': name,
        'deposits': round(dep_now / 1e6, 2),                      # $ billions
        'depositGrowthPct': round((dep_now / dep_then - 1) * 100, 1),
        'depositGrowth': round((dep_now - dep_then) / 1e6, 2),    # $ billions
        'populationGrowthPct': round((pop[fips][1] / pop[fips][0] - 1) * 100, 1),
        'population': pop[fips][1],
        'households': round(households),
        'medianIncome': round(acs[fips]['B19013']['estimate']['B19013001']),
        'branches': len(now),
        'householdsPerBranch': round(households / len(now)),
        'communityShare': round(sum(r['DEPSUMBR'] for r in comm_now) / dep_now * 100, 1),
        'communityBranches': len(comm_now),
        'communityGrowth': round((sum(r['DEPSUMBR'] for r in comm_now) - sum(r['DEPSUMBR'] for r in comm_then)) / 1e6, 2),
        'medianCommunityBranch': round(statistics.median(r['DEPSUMBR'] for r in comm_now) / 1e3),  # $ millions
        'top4Share': round(sum(s for s, _ in shares[:4]) * 100, 1),
        'hhi': round(sum((s * 100) ** 2 for s, _ in shares)),
        'leaders': [{'bank': k, 'share': round(s * 100, 1)} for s, k in shares[:3]],
    })

OUT.write_text(json.dumps({
    'asOf': {
        'deposits': f'FDIC Summary of Deposits, June 30, {SOD_YEAR} (growth from June 30, {SOD_BASE_YEAR})',
        'population': f'U.S. Census Bureau county population estimates, April 2020 to July {POP_VINTAGE}',
        'households': f'U.S. Census Bureau American Community Survey, {acs_release}',
    },
    'notes': [
        'Branches holding more than $1.5 billion are treated as booked deposits and excluded.',
        'Community banks are institutions with less than $10 billion in assets.',
    ],
    'markets': markets,
}, indent=2) + '\n')
print(f'Wrote {OUT}')
