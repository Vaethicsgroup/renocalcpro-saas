// lib/ai/assistant/knowledge/i18n.ts
// Wrapper i18n locale-aware pour les fiches knowledge.
// Si locale=en, retourne la version EN (ou fallback FR si traduction manquante).
//
// Stratégie pragmatique : on traduit uniquement les clés stratégiques (label,
// shortDescription, top points) — pas toute la fiche détaillée. L'IA pourra
// traduire à la volée le détail si besoin.

import { FIELD_HELP, type FieldHelp } from "./field-help";
import { AIDS_HELP, type AidExplain } from "./aids-help";

export type AssistantLocale = "fr" | "en" | "es" | "de" | "pt";

// ── FIELD_HELP — traductions EN des labels + whatToPut ────────────────────
const FIELD_HELP_EN: Record<string, Partial<FieldHelp>> = {
  "project.address": {
    label: "Building address",
    whatToPut: "Full address of the audited building (number, street, postal code, city).",
    howToMeasure: "Use the BAN autocomplete suggestions for the most accurate climate zone matching.",
    whyUseful: "Address determines climate zone (H1/H2/H3), altitude, wind exposure, and DJU. All directly impact heating needs and summer comfort.",
  },
  "project.surfaceM2": {
    label: "Habitable surface (m²)",
    whatToPut: "Habitable surface as defined by the loi Carrez: floor area of inhabited rooms, walls excluded, balconies/cellars/non-converted attics excluded.",
    howToMeasure: "Take the floor plan or measure each room with a laser meter. Length × width per room. Exclude any area below 1.80 m ceiling height. Sum all.",
    whyUseful: "Base for ALL kWh/m²/year ratios. A 10% surface error shifts the entire DPE label. Also basis for MaPrimeRénov' aids and AG resolution in copropriété.",
  },
  "project.constructionYear": {
    label: "Construction year",
    whatToPut: "Year the building was constructed (or completed). For multiple wings, take the most representative by surface.",
    howToMeasure: "Check property deed, existing DPE, or town hall (cadastre). Otherwise observe materials: stone = pre-1948, breeze blocks with timber = 1950-1980, visible insulation = post-1975.",
    whyUseful: "Determines original applicable thermal regulation (RT 1974, 1988, 2000, 2005, 2012, 2020) and presumed insulation. Pre-1948 buildings need specific care (vapor-permeable materials).",
  },
  "envelope.walls.materialKey": {
    label: "Exterior wall material",
    whatToPut: "Main structural material of exterior walls (stone, brick, concrete blocks, wood frame, rammed earth, rubble). Choose dominant: if 70% stone + 30% block, pick stone.",
    howToMeasure: "1) Look at an exterior wall from inside (gently scratch render in a discreet corner if needed). 2) Look from outside after light render scaling. 3) Window cross-section shows thickness. 4) Knock with fist: hollow sound = hollow brick/block, dense sound = stone/solid concrete.",
    whyUseful: "Material determines base thermal resistance (R), thermal mass (summer comfort), vapor permeance (condensation risk), and compatibility with interior or exterior insulation. Stone + interior polystyrene = pathology risk.",
  },
  "systems.heating.kind": {
    label: "Main heating system",
    whatToPut: "Boiler (gas, oil, wood, pellets), heat pump (air-air, air-water, geothermal), electric radiators (convectors, radiant panels, inertia), stove (wood, pellets), district heating.",
    howToMeasure: "Locate main unit: boiler in utility room/basement, heat pump with outdoor unit (large metal box), individual electric radiators per room, stove in living room.",
    whyUseful: "Heating represents 60-80% of consumption. Its efficiency, energy source (electric/gas/oil/wood) and COP (heat pumps) determine annual cost AND GHG emissions.",
  },
  // ── Sprint 28 — couverture EN étendue ────────────────────────────────────
  "project.buildingType": { label: "Building type", whatToPut: "Single house, apartment, whole building, commercial/office building.", howToMeasure: "Simple choice: how many dwellings total and are you calculating for one or all?", whyUseful: "Calculation hypotheses (glazing ratio, ventilation type) vary drastically." },
  "project.numberOfLevels": { label: "Number of floors", whatToPut: "Number of stories, counting ground floor as 1.", howToMeasure: "Count habitable floors. Unheated basement does not count.", whyUseful: "Influences roof and ground floor share of heat losses." },
  "project.heightUnderCeiling": { label: "Ceiling height (m)", whatToPut: "Average height between floor and ceiling. Typically 2.30–3.20 m.", howToMeasure: "Laser meter in main room. Weighted average if multiple heights.", whyUseful: "Determines heated volume and energy demand. 50 m³ more = +X% bill." },
  "project.occupancyMode": { label: "Occupation mode", whatToPut: "Primary residence (>8 months/year), secondary, rental, vacant.", howToMeasure: "Simple question. Take dominant status if multiple.", whyUseful: "Conditions aid eligibility (most require primary residence)." },
  "project.ownerStatus": { label: "Legal status vs dwelling", whatToPut: "Owner-occupier, landlord, co-owner, tenant, joint ownership.", howToMeasure: "Property deed.", whyUseful: "Determines scope of works possible alone vs requiring co-ownership AGM." },
  "project.altitudeM": { label: "Altitude (m)", whatToPut: "Altitude above sea level.", howToMeasure: "Auto-filled from address. Otherwise: IGN map, GPS, online.", whyUseful: "Above 800 m, climate coefficients are increased (higher DJU)." },
  "project.climateZone": { label: "Climate zone", whatToPut: "H1 (North, East), H2 (Center, West), H3 (Mediterranean). Auto from address.", howToMeasure: "Auto. RT 2012/RE 2020 climate zone map reference.", whyUseful: "Reference coefficients vary by zone." },
  "project.exposition": { label: "Wind exposure", whatToPut: "Sheltered, normal, exposed (coast, ridge, plain).", howToMeasure: "Site observation. Windbreaks, distance to obstacles.", whyUseful: "Affects infiltration losses (up to +30% on exposed sites)." },
  "envelope.walls.thicknessCm": { label: "Wall thickness (cm)", whatToPut: "Total wall thickness including renders. Old: 40-80 cm. Recent: 20-30 cm.", howToMeasure: "Measure window jamb (open window) — most reliable.", whyUseful: "With material, gives structural thermal resistance." },
  "envelope.walls.insulationKind": { label: "Existing wall insulation", whatToPut: "None, ITI (interior), ITE (exterior), ITR (distributed). If unsure: 'hidden insulation to confirm'.", howToMeasure: "ITI clues: visible plaster doubling, unusual interior thickness. ITE: thick projected render with visible joints, exterior cladding. Disassemble an electrical socket to see wall section.", whyUseful: "Misdetection biases the entire diagnosis." },
  "envelope.walls.exteriorTreatment": { label: "Exterior wall treatment", whatToPut: "Lime render, cement render, wood/metal cladding, exposed stone, paint.", howToMeasure: "Direct observation. Knock: dull = hard cement, hollow = cladding with air gap, irregular grain = lime.", whyUseful: "Affects vapor permeance and ITE compatibility." },
  "envelope.walls.facadeOrientation": { label: "Facade orientation", whatToPut: "N/NE/E/SE/S/SW/W/NW for each main facade with surface area.", howToMeasure: "Compass or town plan.", whyUseful: "South = free winter solar gains + summer overheating risk. North = cold without gain." },
  "envelope.walls.thermalBridges": { label: "Visible thermal bridges", whatToPut: "Continuous concrete balconies, intermediate floors not broken, refends in facade, window jambs.", howToMeasure: "In winter: thermal bridges show humidity stains or mold at corners. Thermal camera ideal.", whyUseful: "Thermal bridges can represent 5-25% of losses." },
  "envelope.walls.weatherProtection": { label: "Driving rain protection", whatToPut: "None, roof overhang > 50 cm, ventilated cladding, waterproof render.", howToMeasure: "Observe roof overhang, surface type. Photos in driving rain reveal water.", whyUseful: "Wall exposed without protection can absorb 5-15% humidity = 30-50% insulation loss." },
  "envelope.roof.kind": { label: "Roof type", whatToPut: "Pitched (traditional/factory trusses), flat roof, mixed. Specify lost or converted attics.", howToMeasure: "Climb attics if accessible. Otherwise observe pitch and request plans.", whyUseful: "Roof represents up to 30% losses. Most cost-effective gesture generally." },
  "envelope.roof.coveringKind": { label: "Roof covering", whatToPut: "Clay tiles, concrete tiles, natural slate, fiber cement, zinc, steel, bituminous waterproofing, green roof.", howToMeasure: "Exterior observation. Strong regionality.", whyUseful: "Affects solar absorption, remaining lifespan, refurb cost." },
  "envelope.roof.atticType": { label: "Attic type", whatToPut: "Lost (uninhabitable), converted (habitable, heated), convertible (future potential).", howToMeasure: "Lost: trap in top floor ceiling. Converted: rooms under rafters.", whyUseful: "Lost = blown insulation cheapest and most effective. Converted = rafter insulation, more complex." },
  "envelope.roof.insulationCm": { label: "Roof insulation thickness (cm)", whatToPut: "0 (none), 5-10 (old), 20-30 (RT 2005-2012), 30-40 (RT 2020/Passivhaus).", howToMeasure: "Lost attic: climb and measure with vertical ruler in wool. Roof terrace: 'unknown' unless plans.", whyUseful: "Determines roof R resistance directly. Without insulation: R≈0.3. With 30 cm: R≈7.5." },
  "envelope.roof.atticVentilation": { label: "Attic ventilation", whatToPut: "None (sealed converted attics), natural (under-tile inlets + ridge outlet), forced (extractor).", howToMeasure: "Observation: presence of socket tiles, openings, ridge outlets.", whyUseful: "Unventilated attic + insulation = condensation risk in mid-season." },
  "envelope.roof.skylightCount": { label: "Number of roof windows (Velux)", whatToPut: "Count number of roof windows (Velux, Roto, Fakro).", howToMeasure: "Visual count.", whyUseful: "Roof window has Uw 50% worse than equivalent vertical. Source of summer overheating south." },
  "envelope.lowerFloor.structure": { label: "Lower floor structure", whatToPut: "On grade, on crawl space, on unheated basement, on heated basement, on garage, between dwellings (collective).", howToMeasure: "Go to basement/cellar/crawl space if accessible. Observe slab underside.", whyUseful: "Floor on crawl space or unheated basement = 7-15% losses." },
  "envelope.lowerFloor.insulationCm": { label: "Lower floor insulation thickness (cm)", whatToPut: "Existing insulation thickness underside or on slab.", howToMeasure: "If accessible: observe underside. Glued PSE panels = insulation. Measure with ruler.", whyUseful: "Determines floor thermal resistance. Target R = 5-7." },
  "envelope.windows.glazingKind": { label: "Glazing type", whatToPut: "Single, standard double, low-E double (VIR), triple.", howToMeasure: "Flame test: bring flame at 5 cm from glazing. Count reflections: 2 = single, 4 = double. VIR: more pinkish reflection.", whyUseful: "Windows = 10-15% losses. Single Uw≈5.8 vs VIR double Uw≈1.2." },
  "envelope.windows.frameMaterial": { label: "Window frame material", whatToPut: "Wood, PVC, aluminum without thermal break, aluminum with thermal break, mixed wood-aluminum.", howToMeasure: "Tap on frame: dull = wood/PVC, metallic = aluminum. Visual: alu with break has black/grey strip visible.", whyUseful: "Frame material influences global Uw. Alu without break Uf≈5 vs PVC/wood 1.3-1.7." },
  "envelope.windows.totalAreaM2": { label: "Total glazed area (m²)", whatToPut: "Sum of all window surfaces, measured outside frame.", howToMeasure: "For each window: width × height of full frame. Add up.", whyUseful: "Glazed/habitable surface ratio determines winter solar gains and summer overheating risk." },
  "envelope.windows.shutterKind": { label: "Solar protection (shutters/blinds)", whatToPut: "None, hinged wood, PVC roller, aluminum roller, persiennes, brise-soleil, exterior blinds.", howToMeasure: "Direct observation.", whyUseful: "Critical for summer comfort: closed shutters reduce solar gains by 60-80%." },
  "envelope.windows.openingType": { label: "Window opening type", whatToPut: "Hinged, tilt-and-turn, sliding (galandage), sliding, fixed.", howToMeasure: "Direct observation.", whyUseful: "Sliding has worse air tightness than hinged (-1 AEV class typically)." },
  "envelope.doors.entranceUw": { label: "Entrance door Uw", whatToPut: "Uw coefficient of main entrance door. Old solid wood ≈ 3-4, new insulated ≈ 1.2-1.8.", howToMeasure: "CEKAL label, or estimation by age and material.", whyUseful: "Entrance door represents up to 5% opaque surface losses. Often neglected." },
  "envelope.airTightnessQ4": { label: "Measured air permeability (Q4Pa-surf)", whatToPut: "Value in m³/(h.m²) under 4 Pa, measured by infiltrometry test. RT 2012 new house = 0.6 max.", howToMeasure: "Blower door test by certified operator (~€500).", whyUseful: "Without air tightness, insulation loses 30-50% efficiency. Mandatory for RE 2020." },
  "systems.heating.fuelType": { label: "Main heating energy", whatToPut: "Electricity, natural gas, propane, oil, log wood, pellet wood, coal, district heating.", howToMeasure: "Meter label or annual bill.", whyUseful: "Determines primary/final energy conversion factor and GHG emissions." },
  "systems.heating.installYear": { label: "Heating installation year", whatToPut: "Year current system was installed (not building construction).", howToMeasure: "Nameplate, maintenance contract, installation invoice.", whyUseful: "Efficiency drops with age (boiler > 20 years = -10 to -20% efficiency)." },
  "systems.heating.distribution": { label: "Heat distribution mode", whatToPut: "Water radiators, electric radiators, water underfloor heating, electric underfloor heating, air blowing.", howToMeasure: "Direct observation. Water radiators = piping + thermostatic valve. Underfloor = no visible radiator.", whyUseful: "Distribution conditions compatibility with generator change. High-perf air-water HP requires low-T radiators." },
  "systems.heating.regulation": { label: "Heating regulation", whatToPut: "None, single thermostat, thermostatic valves per room, time programming, outdoor sensor, connected.", howToMeasure: "Check each room. Programming = thermostat screen.", whyUseful: "Good regulation can save 15-25% consumption at equal comfort." },
  "systems.heating.powerKw": { label: "Generator power (kW)", whatToPut: "Nominal power in kilowatts of heating generator.", howToMeasure: "Equipment nameplate. 'Useful power' or 'Pn' or 'kW'.", whyUseful: "Oversized = short cycles, degraded efficiency. Undersized = discomfort in cold peak." },
  "systems.heating.boilerEfficiency": { label: "Boiler efficiency (%)", whatToPut: "Nominal seasonal efficiency. Old standard ≈ 75%, condensing ≈ 95-105%.", howToMeasure: "Nameplate or maintenance contract (annual report).", whyUseful: "Low efficiency + old boiler = real consumption oversizing. Target >92% for aids." },
  "systems.heating.maintenanceContract": { label: "Heating maintenance contract", whatToPut: "Yes (annual)/no/occasional.", howToMeasure: "Request invoices recent years.", whyUseful: "Annual legal obligation for boilers > 4 kW. Without maintenance, efficiency drops 5-15%/year." },
  "systems.dhw.kind": { label: "Domestic hot water (DHW) production", whatToPut: "Electric tank, thermodynamic tank, mixed boiler, solar water heater, dedicated oil/gas boiler, instant gas.", howToMeasure: "Locate tank or mixed boiler. Thermodynamic has 'bell' on top (integrated HP).", whyUseful: "DHW = 10-20% consumption. Thermodynamic 3× less than classic electric. Solar covers 50-70% needs free." },
  "systems.dhw.tankVolumeL": { label: "DHW tank volume (liters)", whatToPut: "Capacity in liters (50, 100, 150, 200, 250, 300 L).", howToMeasure: "Nameplate. Otherwise: 50 L/person/day standard.", whyUseful: "Undersized = lack hot water at peak. Oversized = important storage losses (1-2 kWh/day)." },
  "systems.dhw.distributionLossLength": { label: "Tank ↔ furthest tap distance (m)", whatToPut: "Estimated length of hot water circuit between tank and farthest bathroom/kitchen.", howToMeasure: "Visually follow pipes. If > 8 m, plan loop or decentralized tank.", whyUseful: "Long distribution = transit heat losses + water waste. Permanent loop can consume 10-15% DHW need." },
  "systems.dhw.dailyVolumeL": { label: "Daily DHW consumption (L/day)", whatToPut: "Estimated daily hot water volume. Standard: 50 L/person.", howToMeasure: "Hot water meter if present. Otherwise: showers × 50L + bath × 150L + dishes × 20L.", whyUseful: "Determines annual DHW need and tank sizing." },
  "systems.dhw.targetTemp": { label: "DHW set temperature (°C)", whatToPut: "Standard 55°C (anti-legionella) to 65°C (comfort).", howToMeasure: "Check tank thermostat or boiler control panel.", whyUseful: "Each °C less = -3% DHW consumption. But < 50°C = legionella risk." },
  "systems.ventilation.kind": { label: "Ventilation", whatToPut: "Natural, single-flow auto-adjusted, single-flow hygro-adjusted, double-flow (with heat recovery).", howToMeasure: "Look for extraction outlets at ceiling (kitchen, bath, WC). + insufflation outlets in bedrooms = double-flow.", whyUseful: "Bad ventilation = humidity, mold. Double-flow recovers 70-90% of outgoing air heat." },
  "systems.ventilation.year": { label: "VMC installation year", whatToPut: "Year VMC installed. If replaced: latest installation.", howToMeasure: "VMC unit nameplate. Otherwise estimation by condition.", whyUseful: "VMC > 15 years often has degraded flow (-30%) and higher consumption." },
  "systems.ventilation.airTightness": { label: "Building air tightness (Q4Pa-surf)", whatToPut: "Permeability value if test done: m³/(h.m²) under 4 Pa. Or category estimate.", howToMeasure: "Blower door test (~€500). RT 2012 max 0.6, old 1.5-3.", whyUseful: "Without tightness, insulation loses 30-50% efficiency." },
  "systems.ventilation.flowRate": { label: "VMC extraction flow (m³/h)", whatToPut: "Total nominal flow per DTU 68.3. T3 house = 60-105 m³/h.", howToMeasure: "VMC nameplate. Or anemometer measurement at outlets.", whyUseful: "Insufficient = humidity, degraded air quality. Over = overheating consumption (incoming air to reheat)." },
  "systems.cooling.kind": { label: "Cooling system", whatToPut: "None, fans, ceiling fans, single split, multi-split, ducted, reversible HP.", howToMeasure: "Observe interior units (wall splits) + outdoor unit. Reversible HP = same equipment as heating.", whyUseful: "Cooling = high summer consumption (1-3 kWh/m²/year). Good passive strategy makes it superfluous." },
  "systems.cooling.scop": { label: "Seasonal performance coefficient (SEER or SCOP)", whatToPut: "SEER (cooling only) or SCOP (reversible) on nameplate.", howToMeasure: "Outdoor unit nameplate. SEER 6+ = good, SEER 3-4 = old.", whyUseful: "Determines electric consumption. HP SEER 7 consumes 2× less than old SEER 3." },
  "systems.lighting.dominantTech": { label: "Dominant lighting technology", whatToPut: "LED, CFL, halogen, incandescent, mixed.", howToMeasure: "Count bulbs per room and type.", whyUseful: "All-LED switch = -70% lighting consumption (5-10% residential total)." },
  "systems.solar.thermalKind": { label: "Solar thermal (hot water solar)", whatToPut: "None, individual CESI, combined SSC (heating + DHW).", howToMeasure: "Flat or vacuum tube solar collectors on south-oriented roof + stratified tank.", whyUseful: "Covers 50-70% DHW needs free. Very good ROI in south, more moderate in north." },
  "systems.solar.pvKwc": { label: "Photovoltaic installed power (kWc)", whatToPut: "Peak power in kWc of existing PV installation (0 if none).", howToMeasure: "Inverter nameplate or EDF OA grid connection contract.", whyUseful: "Determines annual electric production (~1100 kWh/kWc/year south, 950 north)." },
  "scenarios.target": { label: "Renovation scenario goal", whatToPut: "1) comfort + small budget, 2) gain 2 DPE letters, 3) low-energy building (BBC), 4) net zero carbon, 5) accompanied parcours MaPrimeRénov'.", howToMeasure: "Household budget question. How much aids accessible? Current discomfort level?", whyUseful: "Goal determines bouquet of works to propose." },
  "scenarios.budgetMaxEuros": { label: "Maximum envisageable budget (€)", whatToPut: "Total amount household ready to invest, excluding aids.", howToMeasure: "Household discussion. Include mobilizable savings + credit capacity (typically 33% income).", whyUseful: "Upper bound of scenario. If targeted bouquet exceeds, AI suggests prioritization." },
  "scenarios.workConstraints": { label: "Constraints during works", whatToPut: "Occupied during works, temporary move possible, historical monument (ABF), copropriety (AGM needed), seasonality.", howToMeasure: "Household question + town hall visit if protected sector.", whyUseful: "Conditions feasibility and timing." },
  "scenarios.combineWith": { label: "Works to combine", whatToPut: "List of works to include: roof insulation, ITE, joinery, heating, DHW, VMC, photovoltaic.", howToMeasure: "Choose 2-6 priority items.", whyUseful: "Coherent bouquets enable MPR Sérénité eligibility and better global ROI." },
  "scenarios.financingMode": { label: "Financing mode", whatToPut: "Total personal contribution, partial Eco-PTZ, consumer credit, mortgage, mix.", howToMeasure: "Household question. Max credit capacity ≈ 33% income.", whyUseful: "Conditions monthly payment and real budgetary effort." },
  "scenarios.priorityCriterion": { label: "Prioritization criterion", whatToPut: "Maximum ROI, maximum DPE gain, maximum summer comfort, maximum winter comfort, minimum GHG.", howToMeasure: "Discussion with household.", whyUseful: "AI ranks options by criterion. Comfort ≠ ROI ≠ DPE." },
  "aids.householdIncome": { label: "Household reference tax income", whatToPut: "Household reference tax income (RFR) as on tax notice.", howToMeasure: "Tax notice N-1 or N-2.", whyUseful: "Determines MaPrimeRénov' category: Blue/Yellow/Purple/Pink. Aid amounts vary 4×." },
  "aids.householdSize": { label: "Household composition", whatToPut: "Number of people living in dwelling (adults + dependents).", howToMeasure: "2 spouses + 2 dependent children = 4.", whyUseful: "MPR scales vary by composition." },
  "aids.dependents": { label: "Tax dependents", whatToPut: "Number of fiscal dependents (minor children, attached students, disabled).", howToMeasure: "Tax notice 'dependent persons' section.", whyUseful: "Modifies MPR thresholds." },
  "aids.taxYear": { label: "Reference tax year", whatToPut: "N-1 or N-2 depending on aid request date. MPR usually uses N-2.", howToMeasure: "Check on impots.gouv.fr.", whyUseful: "A good year = upper category, less aid. Don't anticipate request unnecessarily." },
  "aids.locationEpci": { label: "EPCI / Communauty of communes", whatToPut: "Name of intercommunal cooperation establishment of municipality.", howToMeasure: "Auto-filled from BAN address. Otherwise banatic.interieur.gouv.fr.", whyUseful: "Many EPCI have cumulative local aids (up to €1,000-3,000)." },
  "aids.regionCode": { label: "Region", whatToPut: "Region code (ARA, IDF, NAQ, etc.). Auto from address.", howToMeasure: "Auto.", whyUseful: "Regional aids sometimes substantial for global renovation." },
  "aids.previousMprReceived": { label: "MaPrimeRénov' already received", whatToPut: "Yes/no. If yes, amount and year.", howToMeasure: "maprimerenov.gouv.fr account history.", whyUseful: "Multi-year ceiling to respect (cumulative). Affects MPR Sérénité eligibility." },
  "comfort.summerComplaints": { label: "Felt summer comfort issues", whatToPut: "Check: attic overheating, south bedroom overheating, lack of air, sleep disruption, mandatory AC.", howToMeasure: "Household question. Ask which months and rooms.", whyUseful: "Orients diagnosis toward summer comfort solutions: thick roof insulation, solar protection, night ventilation, mass." },
  "comfort.winterComplaints": { label: "Felt winter comfort issues", whatToPut: "Check: cold feet, cold-wall sensation, drafts, condensation on windows, mold, hard-to-heat rooms.", howToMeasure: "Household question. Ask which rooms and conditions.", whyUseful: "Orients toward targeted solutions: floor insulation (cold feet), ITE (cold wall), tightness (drafts)." },
  "comfort.indoorTempTarget": { label: "Desired indoor temperature (°C)", whatToPut: "Winter target temperature. Typical 19-21°C in living rooms, 17-19°C bedrooms.", howToMeasure: "Household question.", whyUseful: "1°C more = +7% heating consumption." },
  "comfort.relativeHumidity": { label: "Felt relative humidity (%)", whatToPut: "Habitual range: 40-60% comfortable, < 30% dry, > 70% humid.", howToMeasure: "Digital hygrometer (~€10) in several rooms/seasons.", whyUseful: "High humidity = cold perception in winter, mold. Low = irritation, static." },
  "comfort.acousticSensitivity": { label: "External acoustic discomfort", whatToPut: "Low/medium/high. Sources: road, train, neighbors, industry.", howToMeasure: "Household question. dB measurement possible.", whyUseful: "Indicates need for acoustic windows (Rw 35-40 dB minimum)." },
  "comfort.airQualityComplaints": { label: "Indoor air quality complaints", whatToPut: "Check: persistent odors, allergies, asthma, chronic fatigue, headaches without medical cause.", howToMeasure: "Household question. CMEI diagnosis possible.", whyUseful: "Indicates need for double-flow VMC with filtration and/or revision of VOC-emitting materials." },
  "costs.localPriceLevel": { label: "Local price level", whatToPut: "Low (rural), medium (suburb), high (Paris, large metros, island).", howToMeasure: "Comparative quotes from 3 local companies.", whyUseful: "Labor costs vary ±30% by zone." },
  "costs.includeSelfWork": { label: "Partial self-construction?", whatToPut: "Yes/no. If yes, on which items (paint, demolition, handling).", howToMeasure: "Household question.", whyUseful: "Saves 10-20% but loses MPR eligibility (which requires RGE for installation)." },
  "photos.requiredCount": { label: "Recommended minimum photo count", whatToPut: "For complete audit: 4 facades + 1 roof + 1 floor underside + 1 each room + 1 boiler + 1 HP + 1 VMC + 1 electric meter + 1 gas/oil meter. ~15-25 photos.", howToMeasure: "Listing to respect. 'Identify by photo' works best with sharp, daylight, perpendicular photos.", whyUseful: "Photos = diagnosis traceability + AI Vision feed." },
  "report.auditorSignature": { label: "Auditor signature", whatToPut: "Name + qualification (OPQIBI 1905/RGE Audit/AFNOR DPE).", howToMeasure: "Auto-filled from Pro user profile.", whyUseful: "Regulatory audit conformity (4 May 2022 decree)." },
  "report.includePhotos": { label: "Include photos in PDF report", whatToPut: "Yes (recommended)/no.", howToMeasure: "Toggle.", whyUseful: "Photos = traceability + credibility with client. Increases PDF size." },
  "report.language": { label: "PDF report language", whatToPut: "FR (standard), EN, ES, DE, PT.", howToMeasure: "Selector. Often same as interface.", whyUseful: "For foreign clients or bilingual owners." },
};

// ── FIELD_HELP — traductions ES ──────────────────────────────────────────
const FIELD_HELP_ES: Record<string, Partial<FieldHelp>> = {
  "project.address": {
    label: "Dirección del edificio",
    whatToPut: "Dirección completa del inmueble auditado (número, calle, código postal, ciudad).",
    howToMeasure: "Use la autocompletación oficial. Priorice la selección sobre la entrada manual.",
    whyUseful: "La dirección permite obtener la zona climática, altitud, exposición a vientos. Influye directamente sobre las necesidades de calefacción y el confort de verano.",
  },
  "project.surfaceM2": {
    label: "Superficie habitable (m²)",
    whatToPut: "Superficie habitable según ley Carrez: área útil de las habitaciones, excluyendo muros, balcones, sótanos, desvanes no acondicionados.",
    howToMeasure: "Tome el plano o mida cada habitación con un metro láser. Largo × ancho. Excluya áreas con altura de techo < 1,80 m. Sume todo.",
    whyUseful: "Base de TODOS los ratios kWh/m²/año. Un error del 10 % en superficie desplaza toda la etiqueta DPE.",
  },
  "project.constructionYear": {
    label: "Año de construcción",
    whatToPut: "Año en que se construyó el edificio. Para varios cuerpos, tome el más representativo en superficie.",
    howToMeasure: "Escritura, DPE existente, ayuntamiento. Materiales: piedra = pre-1948, bloque + viga madera = 1950-1980, aislamiento visible = post-1975.",
    whyUseful: "Determina la normativa térmica original aplicable y por tanto el aislamiento presunto.",
  },
  "envelope.walls.materialKey": {
    label: "Material de muros exteriores",
    whatToPut: "Material estructural principal (piedra, ladrillo, bloque hormigón, hormigón, entramado madera, tapial, mampostería). Elija dominante.",
    howToMeasure: "Observe muro exterior desde el interior. Toque con puño: sonido hueco = ladrillo hueco/bloque, sonido macizo = piedra/hormigón pleno.",
    whyUseful: "El material determina resistencia térmica base, inercia, permeabilidad al vapor y compatibilidad con aislamiento.",
  },
  "systems.heating.kind": {
    label: "Sistema principal de calefacción",
    whatToPut: "Caldera (gas, gasoil, leña, pellets), bomba de calor (aire-aire, aire-agua, geotérmica), radiadores eléctricos, estufa, red de calor urbano.",
    howToMeasure: "Localice unidad principal: caldera en cuarto técnico, BC con unidad exterior, radiadores eléctricos individuales, estufa en salón.",
    whyUseful: "Calefacción = 60-80 % del consumo. Su rendimiento, energía y COP determinan la factura anual y emisiones GEI.",
  },
};

// ── FIELD_HELP — traductions ES étendues Sprint 29 (label + whatToPut) ───
const FIELD_HELP_ES_EXTENDED: Record<string, Partial<FieldHelp>> = {
  "project.buildingType": { label: "Tipo de edificio", whatToPut: "Casa unifamiliar, apartamento, edificio entero, terciario (oficinas/comercio)." },
  "project.numberOfLevels": { label: "Número de plantas", whatToPut: "Número de plantas, contando planta baja como 1." },
  "project.heightUnderCeiling": { label: "Altura libre interior (m)", whatToPut: "Altura media entre suelo terminado y techo. Típica 2,30–3,20 m." },
  "project.occupancyMode": { label: "Modo de ocupación", whatToPut: "Residencia principal (>8 meses/año), secundaria, alquiler, vacante." },
  "project.ownerStatus": { label: "Estado jurídico vivienda", whatToPut: "Propietario ocupante, arrendador, copropietario, inquilino, usufructuario, indiviso." },
  "project.altitudeM": { label: "Altitud (m)", whatToPut: "Altitud del edificio sobre nivel del mar." },
  "project.climateZone": { label: "Zona climática", whatToPut: "Zona H1 (Norte/Este), H2 (Centro/Oeste), H3 (Mediterráneo). Auto desde dirección." },
  "envelope.walls.thicknessCm": { label: "Espesor del muro (cm)", whatToPut: "Espesor total del muro exterior, incluidos enlucidos. Antiguo: 40-80 cm. Reciente: 20-30." },
  "envelope.walls.insulationKind": { label: "Aislamiento de muros existente", whatToPut: "Ninguno, ITI (interior), ITE (exterior), ITR (distribuido). Si duda: 'aislamiento oculto'." },
  "envelope.walls.exteriorTreatment": { label: "Tratamiento exterior de muros", whatToPut: "Enlucido cal, enlucido cemento, revestimiento madera/metal, piedra vista, pintura." },
  "envelope.walls.facadeOrientation": { label: "Orientación de fachadas", whatToPut: "N/NE/E/SE/S/SO/O/NO para cada fachada principal con su superficie." },
  "envelope.roof.kind": { label: "Tipo de cubierta", whatToPut: "Cubierta inclinada (estructura tradicional/cerchas), cubierta plana, mixta. Indicar desván perdido/habitable." },
  "envelope.roof.atticType": { label: "Tipo de desván", whatToPut: "Perdido (no habitable), acondicionado (habitable, calefactado), acondicionable (potencial futuro)." },
  "envelope.roof.insulationCm": { label: "Espesor de aislante en cubierta (cm)", whatToPut: "Espesor existente: 0 (ninguno), 5-10 (antiguo), 20-30 (RT 2005-2012), 30-40 (RT 2020/Passivhaus)." },
  "envelope.lowerFloor.structure": { label: "Estructura del suelo inferior", whatToPut: "Sobre terreno, sobre cámara, sobre sótano no calefactado/calefactado, sobre garaje, entre viviendas." },
  "envelope.windows.glazingKind": { label: "Tipo de acristalamiento", whatToPut: "Vidrio simple, doble estándar, doble bajo emisivo (VIR), triple." },
  "envelope.windows.frameMaterial": { label: "Material del marco de ventanas", whatToPut: "Madera, PVC, aluminio sin RPT, aluminio con RPT, mixto madera-aluminio." },
  "envelope.windows.totalAreaM2": { label: "Superficie acristalada total (m²)", whatToPut: "Suma de superficies de todas las ventanas, medida fuera del marco." },
  "envelope.windows.shutterKind": { label: "Protección solar (persianas/contraventanas)", whatToPut: "Ninguna, contraventanas batientes madera, persianas PVC/alu, brise-soleil, persianas exteriores." },
  "envelope.airTightnessQ4": { label: "Permeabilidad al aire medida (Q4Pa-surf)", whatToPut: "Valor en m³/(h.m²) bajo 4 Pa, medido por test infiltrometría. RT 2012 nueva = 0,6 max." },
  "systems.heating.fuelType": { label: "Energía principal calefacción", whatToPut: "Electricidad, gas natural, propano, gasoil, leña, pellet, carbón, red de calor." },
  "systems.heating.installYear": { label: "Año instalación calefacción", whatToPut: "Año de instalación del sistema actual (no construcción del edificio)." },
  "systems.heating.distribution": { label: "Modo de distribución de calor", whatToPut: "Radiadores agua, radiadores eléctricos, suelo radiante agua, suelo radiante eléctrico, aire impulsado." },
  "systems.heating.regulation": { label: "Regulación de calefacción", whatToPut: "Sin regulación, termostato único, válvulas termostáticas por estancia, programación, sonda exterior, conectado." },
  "systems.heating.boilerEfficiency": { label: "Rendimiento caldera (%)", whatToPut: "Rendimiento estacional nominal. Antigua estándar ≈ 75%, condensación ≈ 95-105%." },
  "systems.dhw.kind": { label: "Producción de ACS", whatToPut: "Termo eléctrico, termo aerotérmico, caldera mixta, ACS solar, caldera dedicada, instantáneo gas." },
  "systems.dhw.tankVolumeL": { label: "Volumen del termo ACS (litros)", whatToPut: "Capacidad en litros (50, 100, 150, 200, 250, 300 L)." },
  "systems.dhw.dailyVolumeL": { label: "Consumo diario ACS (L/día)", whatToPut: "Volumen estimado de agua caliente diaria. Estándar: 50 L/persona." },
  "systems.ventilation.kind": { label: "Ventilación", whatToPut: "Natural, VMC simple flujo autorregulada, VMC simple flujo higrorregulada, VMC doble flujo." },
  "systems.cooling.kind": { label: "Sistema de refrigeración", whatToPut: "Ninguno, ventiladores, ventiladores de techo, split simple, multisplit, conductos, BC reversible." },
  "scenarios.target": { label: "Objetivo del escenario de obras", whatToPut: "1) confort + presupuesto pequeño, 2) salto 2 letras DPE, 3) edificio bajo consumo, 4) cero carbono, 5) parcours acompañado." },
  "scenarios.budgetMaxEuros": { label: "Presupuesto máximo (€)", whatToPut: "Importe total que el hogar está dispuesto a invertir, sin contar ayudas." },
  "aids.householdIncome": { label: "Renta fiscal de referencia del hogar", whatToPut: "RFR del hogar como aparece en aviso fiscal." },
  "aids.householdSize": { label: "Composición del hogar", whatToPut: "Número de personas viviendo en la vivienda (adultos + dependientes fiscales)." },
  "aids.dependents": { label: "Personas a cargo fiscal", whatToPut: "Número de personas a cargo fiscal (menores, estudiantes, discapacitados)." },
  "comfort.summerComplaints": { label: "Problemas de confort de verano", whatToPut: "Marcar: sobrecalentamiento desván, dormitorios sur calientes, falta de aire, recurso obligatorio AC." },
  "comfort.winterComplaints": { label: "Problemas de confort de invierno", whatToPut: "Marcar: pies fríos, sensación pared fría, corrientes, condensación ventanas, moho, estancias difíciles de calentar." },
  "comfort.indoorTempTarget": { label: "Temperatura interior deseada (°C)", whatToPut: "Temperatura objetivo invierno. Típica 19-21°C en salas, 17-19°C en dormitorios." },
};

// ── FIELD_HELP — traductions DE ──────────────────────────────────────────
const FIELD_HELP_DE: Record<string, Partial<FieldHelp>> = {
  "project.address": {
    label: "Adresse des Gebäudes",
    whatToPut: "Vollständige Adresse des geprüften Gebäudes (Hausnummer, Straße, PLZ, Stadt).",
    howToMeasure: "Geben Sie die ersten Zeichen ein, die Autovervollständigung schlägt offizielle Ergebnisse vor.",
    whyUseful: "Die Adresse erlaubt das Abrufen der Klimazone, Höhenlage, Windexposition. Direkter Einfluss auf Heizbedarf und Sommerkomfort.",
  },
  "project.surfaceM2": {
    label: "Wohnfläche (m²)",
    whatToPut: "Wohnfläche nach Carrez-Gesetz: Bodenfläche der Wohnräume, ohne Wände, Balkone, Keller, nicht ausgebaute Dachräume.",
    howToMeasure: "Plan nehmen oder Raum für Raum mit Lasermessgerät messen. Länge × Breite. Bereiche unter 1,80 m Deckenhöhe ausschließen.",
    whyUseful: "Basis ALLER kWh/m²/Jahr-Verhältnisse. 10 % Fehler verschiebt das gesamte DPE-Label.",
  },
  "project.constructionYear": {
    label: "Baujahr",
    whatToPut: "Jahr, in dem das Gebäude errichtet wurde. Bei mehreren Bauteilen: das flächenmäßig dominante.",
    howToMeasure: "Eigentumsurkunde, bestehender DPE, Rathaus. Materialien: Stein = vor 1948, Hohlblock + Holzdach = 1950-1980, sichtbare Dämmung = nach 1975.",
    whyUseful: "Bestimmt die ursprünglich anwendbare Wärmeschutzverordnung und damit die vermutete Dämmung.",
  },
  "envelope.walls.materialKey": {
    label: "Material der Außenwände",
    whatToPut: "Hauptkonstruktionsmaterial (Stein, Ziegel, Hohlblock, Beton, Holzrahmen, Stampflehm, Bruchstein). Dominante Option wählen.",
    howToMeasure: "Außenwand von innen beobachten. Mit Faust klopfen: hohler Klang = Hohlziegel/-block, voller Klang = Stein/Vollbeton.",
    whyUseful: "Material bestimmt thermischen Widerstand, Speichermasse, Dampfdurchlässigkeit und Verträglichkeit mit Dämmung.",
  },
  "systems.heating.kind": {
    label: "Hauptheizungsanlage",
    whatToPut: "Kessel (Gas, Öl, Holz, Pellets), Wärmepumpe (Luft-Luft, Luft-Wasser, Erdwärme), Elektroheizung, Ofen, Fernwärme.",
    howToMeasure: "Hauptgerät lokalisieren: Kessel im Keller, WP mit Außengerät, Elektroheizkörper individuell, Ofen im Wohnzimmer.",
    whyUseful: "Heizung = 60-80 % Verbrauch. Wirkungsgrad, Energieträger und COP bestimmen Jahreskosten und Emissionen.",
  },
};

// ── FIELD_HELP — traductions DE étendues Sprint 29 ───────────────────────
const FIELD_HELP_DE_EXTENDED: Record<string, Partial<FieldHelp>> = {
  "project.buildingType": { label: "Gebäudetyp", whatToPut: "Einfamilienhaus, Wohnung, Mehrfamilienhaus, Gewerbe (Büro/Geschäft)." },
  "project.numberOfLevels": { label: "Anzahl Geschosse", whatToPut: "Anzahl Etagen, Erdgeschoss zählt als 1." },
  "project.heightUnderCeiling": { label: "Raumhöhe (m)", whatToPut: "Mittlere Höhe zwischen Boden und Decke. Typisch 2,30–3,20 m." },
  "project.occupancyMode": { label: "Nutzungsart", whatToPut: "Hauptwohnsitz (>8 Monate/Jahr), Zweitwohnsitz, Vermietung, leerstehend." },
  "project.altitudeM": { label: "Höhenlage (m)", whatToPut: "Höhe des Gebäudes über dem Meeresspiegel." },
  "envelope.walls.thicknessCm": { label: "Wandstärke (cm)", whatToPut: "Gesamtwandstärke einschließlich Putz. Alt: 40-80 cm. Neu: 20-30 cm." },
  "envelope.walls.insulationKind": { label: "Vorhandene Wanddämmung", whatToPut: "Keine, Innen (ITI), Außen (WDVS/ITE), verteilt (ITR). Bei Unsicherheit: 'verborgen'." },
  "envelope.walls.facadeOrientation": { label: "Fassadenausrichtung", whatToPut: "N/NO/O/SO/S/SW/W/NW für jede Hauptfassade mit Fläche." },
  "envelope.roof.kind": { label: "Dachtyp", whatToPut: "Steildach (Sparrendach/Industrie-Dachstuhl), Flachdach, Mischtyp. Spitzboden ungenutzt/ausgebaut?" },
  "envelope.roof.atticType": { label: "Dachbodentyp", whatToPut: "Ungenutzt (nicht bewohnbar), ausgebaut (bewohnbar, beheizt), ausbaufähig." },
  "envelope.roof.insulationCm": { label: "Dachdämmungsstärke (cm)", whatToPut: "Vorhandene Stärke: 0 (keine), 5-10 (alt), 20-30 (RT 2005-2012), 30-40 (RT 2020/Passivhaus)." },
  "envelope.lowerFloor.structure": { label: "Untergeschoss-Konstruktion", whatToPut: "Bodenplatte, über Kriechkeller, über unbeheiztem Keller/beheiztem Keller, über Garage, zwischen Wohnungen." },
  "envelope.windows.glazingKind": { label: "Verglasungstyp", whatToPut: "Einfachverglasung, Standard-Doppelverglasung, Wärmeschutz-Doppelverglasung (VIR), Dreifachverglasung." },
  "envelope.windows.frameMaterial": { label: "Fensterrahmenmaterial", whatToPut: "Holz, PVC, Aluminium ohne Wärmebrücke, Aluminium mit Wärmebrücke, Holz-Aluminium." },
  "envelope.windows.totalAreaM2": { label: "Gesamte verglaste Fläche (m²)", whatToPut: "Summe aller Fensterflächen, gemessen außerhalb des Rahmens." },
  "envelope.airTightnessQ4": { label: "Gemessene Luftdurchlässigkeit (Q4Pa-surf)", whatToPut: "Wert in m³/(h.m²) bei 4 Pa, Blower Door Test. RT 2012 Neubau = 0,6 max." },
  "systems.heating.fuelType": { label: "Hauptheizenergie", whatToPut: "Strom, Erdgas, Propan, Heizöl, Holz, Pellets, Kohle, Fernwärme." },
  "systems.heating.installYear": { label: "Installationsjahr Heizung", whatToPut: "Jahr der aktuellen Anlage (nicht Baujahr Gebäude)." },
  "systems.heating.boilerEfficiency": { label: "Kesselwirkungsgrad (%)", whatToPut: "Saisonaler Nominalwirkungsgrad. Alter Standard ≈ 75%, Brennwert ≈ 95-105%." },
  "systems.dhw.kind": { label: "Warmwasserbereitung (DHW)", whatToPut: "Elektrospeicher, Wärmepumpenspeicher, Mischkessel, Solarspeicher, dedizierter Öl/Gas-Kessel, Gasdurchlauferhitzer." },
  "systems.ventilation.kind": { label: "Lüftung", whatToPut: "Natürlich, Abluftanlage, hygrogeregelte Abluft, Zu-/Abluftanlage mit Wärmerückgewinnung." },
  "scenarios.target": { label: "Sanierungs-Szenarioziel", whatToPut: "1) Komfort + kleines Budget, 2) 2 DPE-Klassen Sprung, 3) Niedrigenergiehaus, 4) Klimaneutral, 5) MaPrimeRénov' Sérénité." },
  "aids.householdIncome": { label: "Steuerliches Referenzeinkommen Haushalt", whatToPut: "RFR des Haushalts wie auf Steuerbescheid angegeben." },
  "aids.householdSize": { label: "Haushaltszusammensetzung", whatToPut: "Anzahl Personen im Haushalt (Erwachsene + steuerlich abhängige)." },
  "comfort.summerComplaints": { label: "Sommerkomfort-Beschwerden", whatToPut: "Markieren: Dachbodenüberhitzung, Süd-Schlafzimmer überhitzt, Luftmangel, AC unerlässlich." },
  "comfort.winterComplaints": { label: "Winterkomfort-Beschwerden", whatToPut: "Markieren: kalte Füße, Wandkältegefühl, Zugluft, Fensterkondensation, Schimmel, schwer zu heizende Räume." },
};

// ── FIELD_HELP — traductions PT ──────────────────────────────────────────
const FIELD_HELP_PT: Record<string, Partial<FieldHelp>> = {
  "project.address": {
    label: "Endereço do edifício",
    whatToPut: "Endereço completo do edifício auditado (número, rua, código postal, cidade).",
    howToMeasure: "Digite os primeiros caracteres, a autocompletação BAN sugere resultados oficiais.",
    whyUseful: "O endereço permite obter a zona climática, altitude, exposição aos ventos. Influencia diretamente as necessidades de aquecimento e o conforto de verão.",
  },
  "project.surfaceM2": {
    label: "Superfície habitável (m²)",
    whatToPut: "Superfície habitável segundo a lei Carrez: área de chão dos cómodos habitáveis, excluindo muros, varandas, caves, sótãos não convertidos.",
    howToMeasure: "Tome a planta ou meça cada cómodo com medidor laser. Comprimento × largura. Exclua áreas com pé direito < 1,80 m.",
    whyUseful: "Base de TODOS os rácios kWh/m²/ano. Um erro de 10 % desloca toda a etiqueta DPE.",
  },
  "project.constructionYear": {
    label: "Ano de construção",
    whatToPut: "Ano em que o edifício foi construído. Para várias alas, tome a mais representativa em superfície.",
    howToMeasure: "Escritura, DPE existente, câmara municipal. Materiais: pedra = anterior a 1948, bloco + viga madeira = 1950-1980, isolamento visível = pós-1975.",
    whyUseful: "Determina a normativa térmica original aplicável e portanto o isolamento presumido.",
  },
  "envelope.walls.materialKey": {
    label: "Material das paredes exteriores",
    whatToPut: "Material estrutural principal (pedra, tijolo, bloco betão, betão, estrutura madeira, taipa, alvenaria). Escolha dominante.",
    howToMeasure: "Observe parede exterior do interior. Bata com punho: som oco = tijolo oco/bloco, som maciço = pedra/betão pleno.",
    whyUseful: "O material determina resistência térmica base, inércia, permeabilidade ao vapor e compatibilidade com isolamento.",
  },
  "systems.heating.kind": {
    label: "Sistema principal de aquecimento",
    whatToPut: "Caldeira (gás, gasóleo, lenha, pellets), bomba de calor (ar-ar, ar-água, geotérmica), radiadores elétricos, salamandra, rede de calor urbano.",
    howToMeasure: "Localize a unidade principal: caldeira em sala técnica, BC com unidade exterior, radiadores elétricos individuais, salamandra na sala.",
    whyUseful: "Aquecimento = 60-80 % do consumo. Rendimento, energia e COP determinam a fatura anual e emissões GEE.",
  },
};

// ── FIELD_HELP — traductions PT étendues Sprint 29 ───────────────────────
const FIELD_HELP_PT_EXTENDED: Record<string, Partial<FieldHelp>> = {
  "project.buildingType": { label: "Tipo de edifício", whatToPut: "Casa unifamiliar, apartamento, edifício inteiro, terciário (escritório/comércio)." },
  "project.numberOfLevels": { label: "Número de pisos", whatToPut: "Número de pisos, contando rés-do-chão como 1." },
  "project.heightUnderCeiling": { label: "Pé-direito (m)", whatToPut: "Altura média entre chão acabado e teto. Típica 2,30–3,20 m." },
  "project.occupancyMode": { label: "Modo de ocupação", whatToPut: "Residência principal (>8 meses/ano), secundária, arrendamento, vaga." },
  "project.altitudeM": { label: "Altitude (m)", whatToPut: "Altitude do edifício acima do nível do mar." },
  "envelope.walls.thicknessCm": { label: "Espessura da parede (cm)", whatToPut: "Espessura total da parede exterior, incluindo rebocos. Antiga: 40-80 cm. Recente: 20-30 cm." },
  "envelope.walls.insulationKind": { label: "Isolamento de paredes existente", whatToPut: "Nenhum, ITI (interior), ITE (exterior), ITR (distribuído). Em dúvida: 'oculto'." },
  "envelope.walls.facadeOrientation": { label: "Orientação das fachadas", whatToPut: "N/NE/E/SE/S/SO/O/NO para cada fachada principal com sua superfície." },
  "envelope.roof.kind": { label: "Tipo de cobertura", whatToPut: "Inclinada (estrutura tradicional/asnas), terraço, mista. Sótão perdido/habitável?" },
  "envelope.roof.atticType": { label: "Tipo de sótão", whatToPut: "Perdido (não habitável), habitável (aquecido), habitável potencial." },
  "envelope.roof.insulationCm": { label: "Espessura de isolante na cobertura (cm)", whatToPut: "Existente: 0 (nenhum), 5-10 (antigo), 20-30 (RT 2005-2012), 30-40 (RT 2020/Passivhaus)." },
  "envelope.lowerFloor.structure": { label: "Estrutura do piso inferior", whatToPut: "Sobre terra-plena, sobre câmara, sobre cave não/aquecida, sobre garagem, entre habitações." },
  "envelope.windows.glazingKind": { label: "Tipo de envidraçado", whatToPut: "Vidro simples, duplo padrão, duplo baixo emissivo (VIR), triplo." },
  "envelope.windows.frameMaterial": { label: "Material do caixilho de janelas", whatToPut: "Madeira, PVC, alumínio sem RPT, alumínio com RPT, misto madeira-alumínio." },
  "envelope.windows.totalAreaM2": { label: "Área envidraçada total (m²)", whatToPut: "Soma das superfícies de todas as janelas, medida fora do caixilho." },
  "envelope.airTightnessQ4": { label: "Permeabilidade ao ar medida (Q4Pa-surf)", whatToPut: "Valor em m³/(h.m²) sob 4 Pa, medido por teste infiltrometria. RT 2012 nova = 0,6 max." },
  "systems.heating.fuelType": { label: "Energia principal aquecimento", whatToPut: "Eletricidade, gás natural, propano, gasóleo, lenha, pellets, carvão, rede de calor." },
  "systems.heating.installYear": { label: "Ano instalação aquecimento", whatToPut: "Ano de instalação do sistema atual (não construção do edifício)." },
  "systems.heating.boilerEfficiency": { label: "Rendimento da caldeira (%)", whatToPut: "Rendimento sazonal nominal. Antiga padrão ≈ 75%, condensação ≈ 95-105%." },
  "systems.dhw.kind": { label: "Produção de AQS", whatToPut: "Termoacumulador elétrico, termodinâmico, caldeira mista, AQS solar, caldeira dedicada, instantâneo gás." },
  "systems.ventilation.kind": { label: "Ventilação", whatToPut: "Natural, VMC fluxo simples auto-regulada, VMC fluxo simples higrorregulada, VMC duplo fluxo." },
  "scenarios.target": { label: "Objetivo do cenário de obras", whatToPut: "1) conforto + pequeno orçamento, 2) salto 2 letras DPE, 3) edifício baixo consumo, 4) zero carbono, 5) percurso acompanhado." },
  "aids.householdIncome": { label: "Rendimento fiscal de referência do agregado", whatToPut: "RFR do agregado como aparece no aviso fiscal." },
  "aids.householdSize": { label: "Composição do agregado", whatToPut: "Número de pessoas vivendo na habitação (adultos + dependentes fiscais)." },
  "comfort.summerComplaints": { label: "Problemas de conforto de verão", whatToPut: "Marcar: sobreaquecimento sótão, quartos sul quentes, falta de ar, recurso obrigatório AC." },
  "comfort.winterComplaints": { label: "Problemas de conforto de inverno", whatToPut: "Marcar: pés frios, sensação parede fria, correntes, condensação janelas, mofo, divisões difíceis de aquecer." },
};

// ── AIDS_HELP — traductions ES ───────────────────────────────────────────
const AIDS_HELP_ES: Record<string, Partial<AidExplain>> = {
  mpr_classique: {
    label: "MaPrimeRénov' (vía por gesto)",
    shortDescription: "Ayuda forfetaria estatal francesa para obras de ahorro energético tomadas individualmente.",
  },
  mpr_serenite: {
    label: "MaPrimeRénov' Vía Acompañada",
    shortDescription: "Ayuda para rehabilitación global (ganancia ≥ 35 %), con acompañamiento obligatorio.",
  },
  cee_coup_pouce_chauffage: {
    label: "CEE — Bonus calefacción",
    shortDescription: "Prima de proveedores de energía para reemplazar calefacción fósil por renovable.",
  },
  eco_ptz: { label: "Eco-préstamo a tasa cero", shortDescription: "Préstamo sin interés hasta 50 000 € para obras de mejora energética." },
  tva_reduite: { label: "IVA reducido 5,5 %", shortDescription: "IVA al 5,5 % en lugar de 20 % para obras elegibles." },
};

// ── AIDS_HELP — traductions DE ───────────────────────────────────────────
const AIDS_HELP_DE: Record<string, Partial<AidExplain>> = {
  mpr_classique: {
    label: "MaPrimeRénov' (Einzelmaßnahmen-Pfad)",
    shortDescription: "Pauschale staatliche Beihilfe (FR) für Einzelmaßnahmen zur Energieeinsparung.",
  },
  mpr_serenite: {
    label: "MaPrimeRénov' Begleiteter Pfad",
    shortDescription: "Beihilfe für Gesamtsanierung (≥ 35 % Einsparung), mit obligatorischer Begleitung.",
  },
  cee_coup_pouce_chauffage: {
    label: "CEE — Heizungsbonus",
    shortDescription: "Prämie von Energieversorgern für Ersatz fossiler Heizung durch erneuerbare.",
  },
  eco_ptz: { label: "Zinsloses Eco-Darlehen", shortDescription: "Zinsloses Darlehen bis 50.000 € für Energieverbesserungsarbeiten." },
  tva_reduite: { label: "Ermäßigte MwSt 5,5 %", shortDescription: "MwSt 5,5 % statt 20 % für förderfähige Arbeiten." },
};

// ── AIDS_HELP — traductions PT ───────────────────────────────────────────
const AIDS_HELP_PT: Record<string, Partial<AidExplain>> = {
  mpr_classique: {
    label: "MaPrimeRénov' (via por gesto)",
    shortDescription: "Ajuda forfetária estatal francesa para obras de poupança energética tomadas individualmente.",
  },
  mpr_serenite: {
    label: "MaPrimeRénov' Via Acompanhada",
    shortDescription: "Ajuda para reabilitação global (ganho ≥ 35 %), com acompanhamento obrigatório.",
  },
  cee_coup_pouce_chauffage: {
    label: "CEE — Bónus aquecimento",
    shortDescription: "Prémio dos fornecedores de energia para substituir aquecimento fóssil por renovável.",
  },
  eco_ptz: { label: "Eco-empréstimo a taxa zero", shortDescription: "Empréstimo sem juros até 50 000 € para obras de melhoria energética." },
  tva_reduite: { label: "IVA reduzido 5,5 %", shortDescription: "IVA a 5,5 % em vez de 20 % para obras elegíveis." },
};

// ── AIDS_HELP — traductions EN des labels + descriptions courtes ─────────
const AIDS_HELP_EN: Record<string, Partial<AidExplain>> = {
  mpr_classique: {
    label: "MaPrimeRénov' (single-action route)",
    shortDescription: "Flat-rate State aid for individual energy-saving works (insulation, heating change, etc.).",
  },
  mpr_serenite: {
    label: "MaPrimeRénov' Accompanied Route (formerly Sérénité)",
    shortDescription: "Aid for global renovation (≥35% consumption gain), with mandatory accompaniment by Mon Accompagnateur Rénov'.",
  },
  cee_coup_pouce_chauffage: {
    label: "CEE — Heating Boost Premium",
    shortDescription: "Premium from energy suppliers (CEE obligated entities) for replacing fossil heating with renewable.",
  },
  eco_ptz: {
    label: "Zero-rate Eco-loan (Éco-PTZ)",
    shortDescription: "Interest-free loan up to €50,000 to finance energy improvement works.",
  },
  tva_reduite: {
    label: "Reduced VAT 5.5%",
    shortDescription: "VAT at 5.5% instead of 20% for eligible energy improvement works.",
  },
};

/** Locale-aware FieldHelp lookup with FR fallback */
export function getFieldHelpI18n(ref: string, locale: AssistantLocale = "fr"): FieldHelp | null {
  const fr = FIELD_HELP[ref];
  if (!fr) return null;
  if (locale === "fr") return fr;
  if (locale === "en") return { ...fr, ...(FIELD_HELP_EN[ref] ?? {}) };
  if (locale === "es") return { ...fr, ...(FIELD_HELP_ES[ref] ?? {}), ...(FIELD_HELP_ES_EXTENDED[ref] ?? {}) };
  if (locale === "de") return { ...fr, ...(FIELD_HELP_DE[ref] ?? {}), ...(FIELD_HELP_DE_EXTENDED[ref] ?? {}) };
  if (locale === "pt") return { ...fr, ...(FIELD_HELP_PT[ref] ?? {}), ...(FIELD_HELP_PT_EXTENDED[ref] ?? {}) };
  return fr;
}

/** Locale-aware AidExplain lookup with FR fallback */
export function getAidExplainI18n(ref: string, locale: AssistantLocale = "fr"): AidExplain | null {
  const fr = AIDS_HELP[ref];
  if (!fr) return null;
  if (locale === "fr") return fr;
  if (locale === "en") return { ...fr, ...(AIDS_HELP_EN[ref] ?? {}) };
  if (locale === "es") return { ...fr, ...(AIDS_HELP_ES[ref] ?? {}) };
  if (locale === "de") return { ...fr, ...(AIDS_HELP_DE[ref] ?? {}) };
  if (locale === "pt") return { ...fr, ...(AIDS_HELP_PT[ref] ?? {}) };
  return fr;
}

/** Coverage stats — utile pour dashboard admin "i18n completeness" */
export function getI18nCoverage(): Record<AssistantLocale, { fields: number; aids: number; total: number; pct: number }> {
  const totalFields = Object.keys(FIELD_HELP).length;
  const totalAids = Object.keys(AIDS_HELP).length;
  const total = totalFields + totalAids;

  const enFields = Object.keys(FIELD_HELP_EN).length;
  const enAids = Object.keys(AIDS_HELP_EN).length;

  // Compter union des refs ES/DE/PT (de base + extensions Sprint 29)
  const esFields = new Set([...Object.keys(FIELD_HELP_ES), ...Object.keys(FIELD_HELP_ES_EXTENDED)]).size;
  const esAids = Object.keys(AIDS_HELP_ES).length;
  const deFields = new Set([...Object.keys(FIELD_HELP_DE), ...Object.keys(FIELD_HELP_DE_EXTENDED)]).size;
  const deAids = Object.keys(AIDS_HELP_DE).length;
  const ptFields = new Set([...Object.keys(FIELD_HELP_PT), ...Object.keys(FIELD_HELP_PT_EXTENDED)]).size;
  const ptAids = Object.keys(AIDS_HELP_PT).length;

  return {
    fr: { fields: totalFields, aids: totalAids, total, pct: 100 },
    en: { fields: enFields, aids: enAids, total: enFields + enAids, pct: Math.round(((enFields + enAids) / total) * 100) },
    es: { fields: esFields, aids: esAids, total: esFields + esAids, pct: Math.round(((esFields + esAids) / total) * 100) },
    de: { fields: deFields, aids: deAids, total: deFields + deAids, pct: Math.round(((deFields + deAids) / total) * 100) },
    pt: { fields: ptFields, aids: ptAids, total: ptFields + ptAids, pct: Math.round(((ptFields + ptAids) / total) * 100) },
  };
}
