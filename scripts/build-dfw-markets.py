#!/usr/bin/env python3
"""Build src/data/dfw-markets.json for the branch-analysis worked example.

Public sources only:
  - FDIC Summary of Deposits (branch deposits, June 30), api.fdic.gov
  - U.S. Census Bureau county population estimates (April 2020 base to July of the vintage year)
  - American Community Survey households and median household income (latest release), via Census Reporter
  - HMDA (CFPB), which carries the FFIEC tract income level and minority share used in CRA and fair-lending
    review, plus home-purchase lending by tract
  - Census geocoder (branch tract) and Census tract gazetteer (tract locations)

Re-run after FDIC publishes a new Summary of Deposits (each fall):
    python3 scripts/build-dfw-markets.py
"""
import collections
import csv
import gzip
import io
import math
import json
import statistics
import urllib.parse
import urllib.request
from pathlib import Path

SOD_YEAR, SOD_BASE_YEAR = 2026, 2021
HMDA_YEAR = 2025
# Towns inside the county the example recommends, for the where-in-the-county view (lat, lon).
TOWNS = {'Kaufman': {'Forney': (32.748, -96.471), 'Terrell': (32.736, -96.275), 'Kaufman': (32.589, -96.309)}}
TOWN_RADIUS_MILES = 5
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
            'fields': 'NAMEFULL,DEPSUMBR,CITYBR,CERT,ASSET,SIMS_LATITUDE,SIMS_LONGITUDE',
            'limit': 10000, 'offset': offset, 'format': 'json',
        })
        d = json.loads(get(f'https://api.fdic.gov/banks/sod?{q}'))
        rows += [r['data'] for r in d['data']]
        if len(rows) >= d['meta']['total'] or not d['data']:
            return rows
        offset += 10000


def tract_of(lat, lon):
    q = urllib.parse.urlencode({'x': lon, 'y': lat, 'benchmark': 'Public_AR_Current', 'vintage': 'Census2020_Current', 'layers': 'Census Tracts', 'format': 'json'})
    for _ in range(3):
        try:
            d = json.loads(get(f'https://geocoding.geo.census.gov/geocoder/geographies/coordinates?{q}'))
            return d['result']['geographies']['Census Tracts'][0]['GEOID']
        except Exception:
            pass
    return None


def hmda_tracts(fips):
    # FFIEC tract data as carried on each HMDA record; income level uses the FFIEC bands.
    raw = urllib.request.urlopen(urllib.request.Request(
        f'https://ffiec.cfpb.gov/v2/data-browser-api/view/csv?counties=48{fips}&years={HMDA_YEAR}',
        headers={'User-Agent': 'curl/8.7.1'})).read()  # the HMDA API rejects other user agents
    try:
        raw = gzip.decompress(raw)
    except OSError:
        pass
    tracts, purchases, mfi = {}, collections.Counter(), None
    for r in csv.DictReader(io.StringIO(raw.decode('utf-8'))):
        t = r['census_tract']
        if t in ('', 'NA') or r['tract_population'] in ('', 'NA', '0'):
            continue  # records without a real tract
        try:
            tracts[t] = {'income': float(r['tract_to_msa_income_percentage']), 'minority': float(r['tract_minority_population_percent']),
                         'population': int(r['tract_population']), 'owner': int(r['tract_owner_occupied_units'])}
            mfi = int(r['ffiec_msa_md_median_family_income'])
        except (ValueError, KeyError):
            continue
        if r['action_taken'] == '1' and r['loan_purpose'] == '1' and r.get('occupancy_type') == '1':
            purchases[t] += 1
    return tracts, purchases, mfi


def miles(a, b):
    return 69 * math.hypot(a[0] - b[0], (a[1] - b[1]) * math.cos(math.radians(a[0])))


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

gaz_raw = get('https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_gaz_tracts_48.txt').decode('latin-1')
tract_location = {r['GEOID']: (float(r['INTPTLAT']), float(r['INTPTLONG'].strip())) for r in csv.DictReader(io.StringIO(gaz_raw), delimiter='|')}

markets, towns = [], {}
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

    # CRA and fair access: FFIEC income bands (low < 50%, moderate 50-80% of the metro median
    # family income), majority-minority tracts, branch locations, and home-purchase lending.
    tracts, purchases, metro_mfi = hmda_tracts(fips)
    lmi = {t for t, x in tracts.items() if x['income'] < 80}
    minority = {t for t, x in tracts.items() if x['minority'] > 50}
    branch_tracts = [tract_of(r['SIMS_LATITUDE'], r['SIMS_LONGITUDE']) for r in sod(name, SOD_YEAR)]
    people = sum(x['population'] for x in tracts.values())
    owners = sum(x['owner'] for x in tracts.values())
    bought = sum(purchases.values())
    markets[-1]['fairAccess'] = {
        'lmiPopulationShare': round(sum(tracts[t]['population'] for t in lmi) / people * 100, 1),
        'minorityPopulationShare': round(sum(tracts[t]['population'] for t in minority) / people * 100, 1),
        'lmiTracts': len(lmi),
        'lmiTractsWithoutBranch': len([t for t in lmi if t not in branch_tracts]),
        'purchaseLoansInLmiShare': round(sum(purchases[t] for t in lmi) / bought * 100, 1),
        'ownerHomesInLmiShare': round(sum(tracts[t]['owner'] for t in lmi) / owners * 100, 1),
        'metroMedianFamilyIncome': metro_mfi,
    }
    for town, point in TOWNS.get(name, {}).items():
        near = [t for t in tracts if t in tract_location and miles(tract_location[t], point) <= TOWN_RADIUS_MILES]
        pop = sum(tracts[t]['population'] for t in near) or 1
        towns.setdefault(name, []).append({
            'town': town,
            'lmiPopulationShare': round(sum(tracts[t]['population'] for t in near if t in lmi) / pop * 100),
            'minorityPopulationShare': round(sum(tracts[t]['population'] for t in near if t in minority) / pop * 100),
            'branches': sum(1 for t in branch_tracts if t in near),
        })

OUT.write_text(json.dumps({
    'asOf': {
        'deposits': f'FDIC Summary of Deposits, June 30, {SOD_YEAR} (growth from June 30, {SOD_BASE_YEAR})',
        'population': f'U.S. Census Bureau county population estimates, April 2020 to July {POP_VINTAGE}',
        'households': f'U.S. Census Bureau American Community Survey, {acs_release}',
        'fairAccess': f'HMDA {HMDA_YEAR} (CFPB) with FFIEC tract income and minority data; branches placed by the Census geocoder',
    },
    'notes': [
        'Branches holding more than $1.5 billion are treated as booked deposits and excluded.',
        'Community banks are institutions with less than $10 billion in assets.',
    ],
    'markets': markets,
    'towns': towns,
}, indent=2) + '\n')
print(f'Wrote {OUT}')
