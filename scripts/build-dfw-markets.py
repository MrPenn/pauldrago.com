#!/usr/bin/env python3
"""Build src/data/dfw-markets.json for the branch-analysis worked example.

Public sources only:
  - FDIC Summary of Deposits (branch deposits, June 30), api.fdic.gov
  - U.S. Census Bureau county population estimates (April 2020 base to July of the vintage year)
  - American Community Survey households and median household income (latest release), via Census Reporter
  - HMDA (CFPB), which carries the FFIEC tract income level and minority share used in CRA and fair-lending
    review, plus home-purchase lending by tract
  - Census geocoder (branch tract) and Census tract gazetteer (tract locations)
  - FDIC Summary of Deposits history for the Dallas-Fort Worth metro, to measure how new branches ramp
  - Census ZIP Code Business Patterns (establishments and employment by town)
  - Census TIGERweb tract and county boundaries, for the county maps (src/data/dfw-map.json)

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
import zipfile
from datetime import datetime
from pathlib import Path

SOD_YEAR, SOD_BASE_YEAR = 2026, 2021
HMDA_YEAR = 2025
# Candidate towns in the two counties the plan covers: town center (lat, lon) and the ZIP codes that
# carry its business counts.
TOWNS = {
    'Kaufman': {
        'Forney': ((32.748, -96.471), ['75126']),
        'Terrell': ((32.736, -96.275), ['75160', '75161']),
        'Kaufman': ((32.589, -96.309), ['75142']),
        'Crandall': ((32.628, -96.456), ['75114']),
    },
    'Ellis': {
        'Midlothian': ((32.482, -96.994), ['76065']),
        'Waxahachie': ((32.386, -96.848), ['75165', '75167']),
        'Red Oak': ((32.517, -96.804), ['75154']),
        'Ennis': ((32.329, -96.625), ['75119']),
    },
}
TOWN_RADIUS_MILES = 5
ZBP_YEARS = (2019, 2023)  # Census ZIP Code Business Patterns, before and latest
# New-branch ramp: community-bank branches opened in the metro in these years, tracked every June since.
RAMP_MSA, RAMP_OPENED, RAMP_HISTORY_FROM = 19100, (2009, 2023), 2008
RAMP_TARGET = 50_000  # $ thousands: break-even with build-out (see PAYBACK below); also the Fed's 15-year median branch
# Branch economics, published figures only.
BRANCH_COST = (250, 1000)  # $ thousands a year: Banking Exchange/Austin Associates (2012) floor; Bits About Money ceiling
NIM = 3.81                 # percent: community-bank net interest margin, FDIC Quarterly Banking Profile, Q2 2026
NIM_INDUSTRY = 3.32        # percent: all-bank net interest margin, same source, for the sensitivity check
BUILD_OUT = 3.5            # $ millions: new freestanding branch (Bancography, via American Banker, April 2026)
PAYBACK_YEARS = 4          # Bancography's break-even time frame, same source
BREAKEVEN = round(BRANCH_COST[1] / NIM * 100)  # $ thousands of deposits that cover a year's running cost (high end)
# Average deposits that pay back the build-out and running cost within PAYBACK_YEARS.
PAYBACK = round((BUILD_OUT * 1000 + PAYBACK_YEARS * BRANCH_COST[1]) / PAYBACK_YEARS / NIM * 100)  # $ thousands
POP_VINTAGE = 2025
COUNTIES = {'Collin': '085', 'Ellis': '139', 'Kaufman': '257'}
# A single branch holding more than this is treated as booked (headquarters or corporate) rather than local.
BOOKED_THRESHOLD = 1_500_000  # $ thousands
COMMUNITY_ASSETS = 10_000_000  # $ thousands: community bank = under $10 billion in assets
UA = {'User-Agent': 'pauldrago.com market research'}
OUT = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'dfw-markets.json'
MAP_OUT = OUT.with_name('dfw-map.json')
MAP_COUNTIES = ('Kaufman', 'Ellis')  # the counties the plan enters
MAP_WIDTH = 600  # SVG units; height follows each county's shape
TIGER = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb'


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


def ramp():
    # Every branch in the metro, every year, keyed by the FDIC's unique branch number.
    by = collections.defaultdict(dict)
    for year in range(RAMP_HISTORY_FROM, SOD_YEAR + 1):
        rows, offset = [], 0
        while True:
            q = urllib.parse.urlencode({
                'filters': f'MSABR:{RAMP_MSA} AND YEAR:{year}',
                'fields': 'UNINUMBR,CERT,DEPSUMBR,ASSET,SIMS_ESTABLISHED_DATE,SIMS_ACQUIRED_DATE,CITYBR,BRSERTYP',
                'limit': 10000, 'offset': offset, 'format': 'json',
            })
            d = json.loads(get(f'https://api.fdic.gov/banks/sod?{q}'))
            rows += [r['data'] for r in d['data']]
            if len(rows) >= d['meta']['total'] or not d['data']:
                break
            offset += 10000
        for r in rows:
            by[r['UNINUMBR']][year] = r
    first = {u: min(ys) for u, ys in by.items()}
    last = {u: max(ys) for u, ys in by.items()}
    by_bank_city = collections.defaultdict(list)
    for u, ys in by.items():
        by_bank_city[(ys[first[u]]['CERT'], ys[first[u]]['CITYBR'])].append(u)
    paths, relocations = [], 0
    for u, ys in by.items():
        r = ys[first[u]]
        try:
            opened = datetime.strptime(r['SIMS_ESTABLISHED_DATE'], '%m/%d/%Y')
        except (TypeError, ValueError):
            continue
        if not RAMP_OPENED[0] <= opened.year <= RAMP_OPENED[1] or first[u] > opened.year + 1:
            continue
        # Full-service brick-and-mortar branches of community banks, opened new (not bought or booked).
        if r['BRSERTYP'] != 11 or r['ASSET'] >= COMMUNITY_ASSETS or r['SIMS_ACQUIRED_DATE']:
            continue
        if max(x['DEPSUMBR'] for x in ys.values()) >= BOOKED_THRESHOLD:
            continue
        # A branch that replaced one the same bank closed in the same town is a relocation: it opened with deposits.
        if any(v != u and opened.year - 1 <= last[v] <= opened.year + 1 and last[v] < SOD_YEAR for v in by_bank_city[(r['CERT'], r['CITYBR'])]):
            relocations += 1
            continue
        path = {int((datetime(y, 6, 30) - opened).days / 365.25 + 0.5): x['DEPSUMBR'] for y, x in ys.items() if datetime(y, 6, 30) >= opened}
        paths.append((path, SOD_YEAR - opened.year))
    by_age = []
    for age in range(1, 6):
        eligible = [p for p, observed in paths if observed >= age]
        still_open = sorted(p[age] for p in eligible if age in p)
        q = statistics.quantiles(still_open, n=4)
        by_age.append({
            'age': age, 'branches': len(eligible),
            'reachedTargetShare': round(sum(1 for p in eligible if any(a <= age and v >= RAMP_TARGET for a, v in p.items())) / len(eligible) * 100),
            'stillOpenShare': round(len(still_open) / len(eligible) * 100),
            'belowBreakevenShare': round(sum(1 for v in still_open if v < BREAKEVEN) / len(eligible) * 100),
            'atTargetShare': round(sum(1 for v in still_open if v >= RAMP_TARGET) / len(eligible) * 100),
            'p25': round(q[0] / 1e3), 'median': round(q[1] / 1e3), 'p75': round(q[2] / 1e3),  # $ millions
        })
    return {'branches': len(paths), 'relocationsExcluded': relocations, 'opened': list(RAMP_OPENED), 'target': RAMP_TARGET // 1000,
            'breakeven': round(BREAKEVEN / 1e3), 'breakevenLow': round(BRANCH_COST[0] / NIM / 10), 'branchCost': list(BRANCH_COST),
            'nim': NIM, 'nimIndustry': NIM_INDUSTRY, 'buildOut': BUILD_OUT, 'paybackYears': PAYBACK_YEARS, 'payback': round(PAYBACK / 1e3), 'byAge': by_age}


def zbp(year):
    raw = zipfile.ZipFile(io.BytesIO(get(f'https://www2.census.gov/programs-surveys/cbp/datasets/{year}/zbp{year % 100}totals.zip')))
    text = raw.read(raw.namelist()[0]).decode('latin-1')
    return {r['zip']: (int(r['est']), int(r['emp'])) for r in csv.DictReader(io.StringIO(text))}


def boundaries(layer, where):
    # Census TIGERweb, generalized to about 100 meters, as GeoJSON in longitude and latitude.
    q = urllib.parse.urlencode({'where': where, 'outFields': 'GEOID,COUNTY', 'outSR': 4326, 'maxAllowableOffset': 0.001, 'f': 'geojson'})
    return json.loads(get(f'{TIGER}/{layer}/query?{q}'))['features']


def rings(geometry):
    return geometry['coordinates'] if geometry['type'] == 'Polygon' else [r for poly in geometry['coordinates'] for r in poly]


def county_map(name, fips, tracts, purchases, branches):
    outline = boundaries('State_County/MapServer/1', f"STATE='48' AND COUNTY='{fips}'")[0]['geometry']
    shapes = boundaries('Tracts_Blocks/MapServer/0', f"STATE='48' AND COUNTY='{fips}'")
    points = [pt for ring in rings(outline) for pt in ring]
    lon0, lon1 = min(p[0] for p in points), max(p[0] for p in points)
    lat0, lat1 = min(p[1] for p in points), max(p[1] for p in points)
    squeeze = math.cos(math.radians((lat0 + lat1) / 2))
    scale = MAP_WIDTH / ((lon1 - lon0) * squeeze)
    xy = lambda lon, lat: (round((lon - lon0) * squeeze * scale, 1), round((lat1 - lat) * scale, 1))
    path = lambda g: ' '.join('M' + 'L'.join(f'{x},{y}' for x, y in (xy(*pt) for pt in ring)) + 'Z' for ring in rings(g))
    lmi = {t for t, v in tracts.items() if v['income'] < 80}
    return {
        'county': name,
        'width': MAP_WIDTH,
        'height': round((lat1 - lat0) * scale),
        'milePx': round(scale / 69, 2),  # one mile of latitude, in SVG units
        'outline': path(outline),
        'tracts': [{
            'geoid': f['properties']['GEOID'],
            'd': path(f['geometry']),
            'purchasesPer1000': round(purchases[f['properties']['GEOID']] / tracts[f['properties']['GEOID']]['population'] * 1000, 1) if f['properties']['GEOID'] in tracts else None,
            'lmi': f['properties']['GEOID'] in lmi,
        } for f in shapes],
        'branches': [{'x': xy(r['SIMS_LONGITUDE'], r['SIMS_LATITUDE'])[0], 'y': xy(r['SIMS_LONGITUDE'], r['SIMS_LATITUDE'])[1],
                      'community': r['ASSET'] < COMMUNITY_ASSETS} for r in branches if r['SIMS_LATITUDE']],
        'towns': [{'town': town, 'x': xy(lon, lat)[0], 'y': xy(lon, lat)[1]} for town, ((lat, lon), _) in TOWNS[name].items()],
    }


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

business = {year: zbp(year) for year in ZBP_YEARS}
markets, towns, maps = [], [], []
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
    all_branches = sod(name, SOD_YEAR)
    branch_tracts = [tract_of(r['SIMS_LATITUDE'], r['SIMS_LONGITUDE']) for r in all_branches]
    if name in MAP_COUNTIES:
        maps.append(county_map(name, fips, tracts, purchases, all_branches))
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
    for town, (point, zips) in TOWNS.get(name, {}).items():
        near = [t for t in tracts if t in tract_location and miles(tract_location[t], point) <= TOWN_RADIUS_MILES]
        residents = sum(tracts[t]['population'] for t in near) or 1
        in_town_now = [r for r in now if r['CITYBR'] == town]
        in_town_then = [r for r in then if r['CITYBR'] == town]
        town_dep = sum(r['DEPSUMBR'] for r in in_town_now)
        est = [sum(business[y].get(z, (0, 0))[0] for z in zips) for y in ZBP_YEARS]
        emp = [sum(business[y].get(z, (0, 0))[1] for z in zips) for y in ZBP_YEARS]
        town_banks = collections.Counter()
        for r in in_town_now:
            town_banks[r['NAMEFULL']] += r['DEPSUMBR']
        leader, leader_dep = town_banks.most_common(1)[0]
        towns.append({
            'town': town, 'county': name,
            'deposits': round(town_dep / 1e3),  # $ millions
            'depositGrowthPct': round((town_dep / sum(r['DEPSUMBR'] for r in in_town_then) - 1) * 100),
            'branches': len(in_town_now),
            'depositsPerBranch': round(town_dep / len(in_town_now) / 1e3),
            'communityShare': round(sum(r['DEPSUMBR'] for r in in_town_now if r['ASSET'] < COMMUNITY_ASSETS) / town_dep * 100),
            'jobs': emp[1], 'jobGrowthPct': round((emp[1] / emp[0] - 1) * 100),
            'businesses': est[1], 'businessGrowthPct': round((est[1] / est[0] - 1) * 100),
            'lmiPopulationShare': round(sum(tracts[t]['population'] for t in near if t in lmi) / residents * 100),
            'minorityPopulationShare': round(sum(tracts[t]['population'] for t in near if t in minority) / residents * 100),
            'lmiTracts': sum(1 for t in near if t in lmi),
            'lmiTractsWithoutBranch': sum(1 for t in near if t in lmi and t not in branch_tracts),
            'largestBank': leader, 'largestBankShare': round(leader_dep / town_dep * 100),
        })

OUT.write_text(json.dumps({
    'asOf': {
        'deposits': f'FDIC Summary of Deposits, June 30, {SOD_YEAR} (growth from June 30, {SOD_BASE_YEAR})',
        'population': f'U.S. Census Bureau county population estimates, April 2020 to July {POP_VINTAGE}',
        'households': f'U.S. Census Bureau American Community Survey, {acs_release}',
        'ramp': f'FDIC Summary of Deposits, June {RAMP_HISTORY_FROM} to June {SOD_YEAR}, Dallas-Fort Worth metro',
        'towns': f'FDIC Summary of Deposits by branch city, {SOD_BASE_YEAR} to {SOD_YEAR}; Census ZIP Code Business Patterns, {ZBP_YEARS[0]} to {ZBP_YEARS[1]}; tracts within {TOWN_RADIUS_MILES} miles of the town center',
        'fairAccess': f'HMDA {HMDA_YEAR} (CFPB) with FFIEC tract income and minority data; branches placed by the Census geocoder',
    },
    'notes': [
        'Branches holding more than $1.5 billion are treated as booked deposits and excluded.',
        'Community banks are institutions with less than $10 billion in assets.',
    ],
    'markets': markets,
    'towns': towns,
    'ramp': ramp(),
}, indent=2) + '\n')
MAP_OUT.write_text(json.dumps({
    'asOf': f'Census TIGERweb tract boundaries; HMDA {HMDA_YEAR} owner-occupied home purchases per 1,000 residents; FDIC Summary of Deposits branch locations, June {SOD_YEAR}',
    'radiusMiles': TOWN_RADIUS_MILES,
    'counties': sorted(maps, key=lambda m: MAP_COUNTIES.index(m['county'])),
}, separators=(',', ':')) + '\n')
print(f'Wrote {OUT} and {MAP_OUT}')
