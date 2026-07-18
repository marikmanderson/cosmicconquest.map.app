(() => {
  "use strict";

  const STORAGE_KEY = "cc_osiris_atlas_state_v040";
  const seed = window.CC_SEED_DATA;
  const STRATEGIC_TIERS = [
    { id: "none", label: "None / RP Only", value: 0 },
    { id: "minor", label: "Minor", value: 1 },
    { id: "standard", label: "Standard", value: 3 },
    { id: "major", label: "Major", value: 6 },
    { id: "critical", label: "Critical", value: 10 },
    { id: "decisive", label: "Decisive", value: 15 }
  ];
  const DEFAULT_PASSWORDS = { command: "", admin: "admin", root: "#RAIDER160%" };
  const DEFAULT_SETTINGS = { disableSatellites: false, disableSatelliteNames: false, disableNames: false, disablePois: false, disablePoiIcons: false, disablePoiRendering: false, poiTypeFilters: {} };
  const ROLE_LABELS = { viewer: "Viewer", command: "Command", admin: "Admin", root: "Root" };
  const state = {
    data: loadData(),
    role: "viewer",
    settings: loadSettings(),
    passwords: loadPasswords(),
    activeView: "system",
    selectedBodyId: "brekka",
    selectedPoiId: null,
    selectedTerrainId: null,
    planetViewMode: localStorage.getItem("cc_planet_view_mode") || "flat",
    planetRotation: { lon: -0.35, lat: 0.10 },
    paused: false,
    showIntelOverlay: true,
    showTerrain: true,
    showPOIs: true,
    showHidden: false,
    placementMode: false,
    planetPlacement: null,
    systemCamera: { x: 0, y: 0, zoom: 1 },
    planetCamera: { x: 0, y: 0, zoom: 1 },
    dragCamera: null,
    suppressSystemClick: false,
    suppressPlanetClick: false,
    bodyPositions: new Map(),
    systemHits: [],
    planetHits: [],
    planetDirty: true,
    textures: {},
    textureCanvases: {},
    systemTextureCanvases: {},
    systemBackgroundCache: null,
    systemBodySpriteCache: new Map(),
    systemOrbitLayerCache: null,
    asteroidPointCache: new Map(),
    controlCache: new Map(),
    sectorBonusCache: new Map(),
    systemControlCache: new Map(),
    planetBackgroundCache: null,
    globeRenderer: null,
    globeRendererUnavailable: false,
    resizeFrame: 0,
    dataRevision: 0,
    staticControlsKey: "",
    uiRenderKeys: { systemControl: "", selected: "", poiList: "", admin: "", bodyIntel: "" },
    lastVisualRenderKey: "",
    lastSavedJson: null,
    lastFrame: performance.now(),
    lastSystemRender: 0,
    lastPlanetRender: 0,
    systemRenderCost: 0,
    animationTime: performance.now(),
    systemDirty: true,
    hoverFrame: 0,
    pendingHover: null,
    hoverKey: "",
    hoverSize: { width: 0, height: 0 }
  };
  state.lastSavedJson = JSON.stringify(state.data);

  const els = {
    tabButtons: [...document.querySelectorAll(".tab-button")],
    settingsBtn: document.getElementById("settingsBtn"),
    settingsMenu: document.getElementById("settingsMenu"),
    settingsCloseBtn: document.getElementById("settingsCloseBtn"),
    disableSatellites: document.getElementById("disableSatellites"),
    disableSatelliteNames: document.getElementById("disableSatelliteNames"),
    disableNames: document.getElementById("disableNames"),
    disablePois: document.getElementById("disablePois"),
    disablePoiIcons: document.getElementById("disablePoiIcons"),
    disablePoiRendering: document.getElementById("disablePoiRendering"),
    poiTypeFilterSettings: document.getElementById("poiTypeFilterSettings"),
    viewerModeBtn: document.getElementById("viewerModeBtn"),
    commandModeBtn: document.getElementById("commandModeBtn"),
    adminModeBtn: document.getElementById("adminModeBtn"),
    rootModeBtn: document.getElementById("rootModeBtn"),
    modeReadout: document.getElementById("modeReadout"),
    revertLastSaveBtn: document.getElementById("revertLastSaveBtn"),
    revertSaveStatus: document.getElementById("revertSaveStatus"),
    systemView: document.getElementById("systemView"),
    planetView: document.getElementById("planetView"),
    logisticsView: document.getElementById("logisticsView"),
    adminView: document.getElementById("adminView"),
    systemCanvas: document.getElementById("systemCanvas"),
    planetCanvas: document.getElementById("planetCanvas"),
    hoverCard: document.getElementById("hoverCard"),
    pauseOrbitBtn: document.getElementById("pauseOrbitBtn"),
    resetViewBtn: document.getElementById("resetViewBtn"),
    toggleIntelBtn: document.getElementById("toggleIntelBtn"),
    planetTitle: document.getElementById("planetTitle"),
    planetSelect: document.getElementById("planetSelect"),
    planetZoomOutBtn: document.getElementById("planetZoomOutBtn"),
    planetZoomInBtn: document.getElementById("planetZoomInBtn"),
    planetFitBtn: document.getElementById("planetFitBtn"),
    planetFlatModeBtn: document.getElementById("planetFlatModeBtn"),
    planetGlobeModeBtn: document.getElementById("planetGlobeModeBtn"),
    planetModeHint: document.getElementById("planetModeHint"),
    showTerrain: document.getElementById("showTerrain"),
    showPOIs: document.getElementById("showPOIs"),
    showHidden: document.getElementById("showHidden"),
    showHiddenSettings: document.getElementById("showHiddenSettings"),
    showHiddenSettingsWrap: document.getElementById("showHiddenSettingsWrap"),
    placementMode: document.getElementById("placementMode"),
    placementReadout: document.getElementById("placementReadout"),
    poiLegend: document.getElementById("poiLegend"),
    controlModePill: document.getElementById("controlModePill"),
    systemControlBars: document.getElementById("systemControlBars"),
    calculationNote: document.getElementById("calculationNote"),
    selectedTitle: document.getElementById("selectedTitle"),
    selectedInfo: document.getElementById("selectedInfo"),
    poiList: document.getElementById("poiList"),
    detailDialog: document.getElementById("detailDialog"),
    closeDialogBtn: document.getElementById("closeDialogBtn"),
    dialogEyebrow: document.getElementById("dialogEyebrow"),
    dialogTitle: document.getElementById("dialogTitle"),
    dialogBody: document.getElementById("dialogBody"),
    factionForm: document.getElementById("factionForm"),
    factionId: document.getElementById("factionId"),
    factionName: document.getElementById("factionName"),
    factionCode: document.getElementById("factionCode"),
    factionColor: document.getElementById("factionColor"),
    factionList: document.getElementById("factionList"),
    factionMergeSource: document.getElementById("factionMergeSource"),
    factionMergeTarget: document.getElementById("factionMergeTarget"),
    mergeFactionBtn: document.getElementById("mergeFactionBtn"),
    poiForm: document.getElementById("poiForm"),
    poiId: document.getElementById("poiId"),
    poiName: document.getElementById("poiName"),
    poiBody: document.getElementById("poiBody"),
    poiType: document.getElementById("poiType"),
    poiSubtype: document.getElementById("poiSubtype"),
    poiModel: document.getElementById("poiModel"),
    poiIconPreview: document.getElementById("poiIconPreview"),
    poiStrategicTier: document.getElementById("poiStrategicTier"),
    poiOwner: document.getElementById("poiOwner"),
    poiOwnerLabel: document.getElementById("poiOwnerLabel"),
    poiColor: document.getElementById("poiColor"),
    poiColorLabel: document.getElementById("poiColorLabel"),
    poiVisibility: document.getElementById("poiVisibility"),
    poiStrategic: document.getElementById("poiStrategic"),
    poiStrategicValueLabel: document.getElementById("poiStrategicValueLabel"),
    poiTactical: document.getElementById("poiTactical"),
    poiDisplaySize: document.getElementById("poiDisplaySize"),
    poiTextSize: document.getElementById("poiTextSize"),
    poiX: document.getElementById("poiX"),
    poiY: document.getElementById("poiY"),
    poiDescription: document.getElementById("poiDescription"),
    poiGmNotes: document.getElementById("poiGmNotes"),
    newPoiBtn: document.getElementById("newPoiBtn"),
    deletePoiBtn: document.getElementById("deletePoiBtn"),
    moonForm: document.getElementById("moonForm"),
    moonName: document.getElementById("moonName"),
    moonParent: document.getElementById("moonParent"),
    moonTemplate: document.getElementById("moonTemplate"),
    moonTexture: document.getElementById("moonTexture"),
    moonOrbit: document.getElementById("moonOrbit"),
    moonWeight: document.getElementById("moonWeight"),
    exportDataBtn: document.getElementById("exportDataBtn"),
    importDataInput: document.getElementById("importDataInput"),
    resetDataBtn: document.getElementById("resetDataBtn"),
    jsonOutput: document.getElementById("jsonOutput"),
    terrainForm: document.getElementById("terrainForm"),
    terrainId: document.getElementById("terrainId"),
    terrainName: document.getElementById("terrainName"),
    terrainBody: document.getElementById("terrainBody"),
    terrainType: document.getElementById("terrainType"),
    terrainX: document.getElementById("terrainX"),
    terrainY: document.getElementById("terrainY"),
    terrainW: document.getElementById("terrainW"),
    terrainH: document.getElementById("terrainH"),
    terrainRotation: document.getElementById("terrainRotation"),
    terrainDensity: document.getElementById("terrainDensity"),
    terrainHazard: document.getElementById("terrainHazard"),
    newTerrainBtn: document.getElementById("newTerrainBtn"),
    deleteTerrainBtn: document.getElementById("deleteTerrainBtn"),
    bodyForm: document.getElementById("bodyForm"),
    bodyEditSelect: document.getElementById("bodyEditSelect"),
    bodyEditName: document.getElementById("bodyEditName"),
    bodyEditRadius: document.getElementById("bodyEditRadius"),
    bodyEditOrbitRadius: document.getElementById("bodyEditOrbitRadius"),
    bodyEditOrbitSpeed: document.getElementById("bodyEditOrbitSpeed"),
    bodyEditWeight: document.getElementById("bodyEditWeight"),
    bodyEditAsteroidDensitySection: document.getElementById("bodyEditAsteroidDensitySection"),
    bodyEditAsteroidDensity: document.getElementById("bodyEditAsteroidDensity"),
    bodyEditAsteroidDensityValue: document.getElementById("bodyEditAsteroidDensityValue"),
    bodyEditTextureSection: document.getElementById("bodyEditTextureSection"),
    bodyEditTexture: document.getElementById("bodyEditTexture"),
    bodyEditTextureStatus: document.getElementById("bodyEditTextureStatus"),
    bodyEditTexturePreview: document.getElementById("bodyEditTexturePreview"),
    bodyEditDescription: document.getElementById("bodyEditDescription"),
    bodyEditStatus: document.getElementById("bodyEditStatus"),
    bodyEditControlOverrideSection: document.getElementById("bodyEditControlOverrideSection"),
    bodyEditControlOverride: document.getElementById("bodyEditControlOverride"),
    bodyEditControlFields: document.getElementById("bodyEditControlFields"),
    bodyEditControlTotal: document.getElementById("bodyEditControlTotal"),
    bodyEditSatellites: document.getElementById("bodyEditSatellites"),
    bodyEditDiameter: document.getElementById("bodyEditDiameter"),
    bodyEditAtmosphere: document.getElementById("bodyEditAtmosphere"),
    bodyEditRotationPeriod: document.getElementById("bodyEditRotationPeriod"),
    bodyEditOrbitalPeriod: document.getElementById("bodyEditOrbitalPeriod"),
    bodyEditClimate: document.getElementById("bodyEditClimate"),
    bodyEditTerrain: document.getElementById("bodyEditTerrain"),
    bodyEditNativeSpecies: document.getElementById("bodyEditNativeSpecies"),
    bodyEditLanguages: document.getElementById("bodyEditLanguages"),
    bodyEditGovernment: document.getElementById("bodyEditGovernment"),
    bodyEditPopulation: document.getElementById("bodyEditPopulation"),
    bodyEditMajorImports: document.getElementById("bodyEditMajorImports"),
    bodyEditMajorExports: document.getElementById("bodyEditMajorExports"),
    deleteBodyBtn: document.getElementById("deleteBodyBtn"),
    deleteBodyNote: document.getElementById("deleteBodyNote"),
    bodyIntel: document.getElementById("bodyIntel"),
    dataToolsCard: document.getElementById("dataToolsCard"),
    passwordToolsCard: document.getElementById("passwordToolsCard"),
    passwordForm: document.getElementById("passwordForm"),
    commandPasswordInput: document.getElementById("commandPasswordInput"),
    adminPasswordInput: document.getElementById("adminPasswordInput"),
    rootPasswordInput: document.getElementById("rootPasswordInput"),
    quickPoiTools: document.getElementById("quickPoiTools"),
    quickPoiMenu: document.getElementById("quickPoiMenu"),
    quickPoiEditor: document.getElementById("quickPoiEditor"),
    quickPoiForm: document.getElementById("quickPoiForm"),
    quickPoiEyebrow: document.getElementById("quickPoiEyebrow"),
    quickPoiTitle: document.getElementById("quickPoiTitle"),
    quickPoiCloseBtn: document.getElementById("quickPoiCloseBtn"),
    quickPoiId: document.getElementById("quickPoiId"),
    quickPoiBody: document.getElementById("quickPoiBody"),
    quickPoiX: document.getElementById("quickPoiX"),
    quickPoiY: document.getElementById("quickPoiY"),
    quickPoiName: document.getElementById("quickPoiName"),
    quickPoiType: document.getElementById("quickPoiType"),
    quickPoiIcon: document.getElementById("quickPoiIcon"),
    quickPoiIconPreview: document.getElementById("quickPoiIconPreview"),
    quickPoiOwner: document.getElementById("quickPoiOwner"),
    quickPoiOwnerLabel: document.getElementById("quickPoiOwnerLabel"),
    quickPoiColor: document.getElementById("quickPoiColor"),
    quickPoiColorLabel: document.getElementById("quickPoiColorLabel"),
    quickPoiVisibility: document.getElementById("quickPoiVisibility"),
    quickPoiStrategicTier: document.getElementById("quickPoiStrategicTier"),
    quickPoiStrategic: document.getElementById("quickPoiStrategic"),
    quickPoiStrategicValueLabel: document.getElementById("quickPoiStrategicValueLabel"),
    quickPoiTactical: document.getElementById("quickPoiTactical"),
    quickPoiDisplaySize: document.getElementById("quickPoiDisplaySize"),
    quickPoiTextSize: document.getElementById("quickPoiTextSize"),
    quickPoiDescription: document.getElementById("quickPoiDescription"),
    quickPoiFullEditBtn: document.getElementById("quickPoiFullEditBtn"),
    quickPoiDeleteBtn: document.getElementById("quickPoiDeleteBtn")
  };

  const systemCtx = els.systemCanvas.getContext("2d");
  const planetCtx = els.planetCanvas.getContext("2d");



  function normalizeRole(role) {
    if (role === "pseudo" || role === "gm") return "command";
    if (["viewer", "command", "admin", "root"].includes(role)) return role;
    return "viewer";
  }

  function loadSettings() {
    try {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem("cc_user_settings") || "{}")) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    localStorage.setItem("cc_user_settings", JSON.stringify(state.settings));
  }

  function loadPasswords() {
    try {
      return { ...DEFAULT_PASSWORDS, ...(JSON.parse(localStorage.getItem("cc_mode_passwords") || "{}")) };
    } catch {
      return { ...DEFAULT_PASSWORDS };
    }
  }

  function savePasswords() {
    localStorage.setItem("cc_mode_passwords", JSON.stringify(state.passwords));
  }

  function isRoot() {
    return state.role === "root";
  }

  function modeLabel() {
    return ROLE_LABELS[state.role] || "Viewer";
  }

  function titleCase(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(seed);
    try {
      const parsed = JSON.parse(raw);
      return migrateData(parsed);
    } catch (err) {
      console.warn("Failed to load local state; falling back to seed data.", err);
      return deepClone(seed);
    }
  }

  function normalizeVisibility(value) {
    if (value === "hidden" || value === "gm" || value === "faction") return "hidden";
    if (value === "discovered") return "discovered";
    return "public";
  }

  function normalizePoiTypeId(typeId) {
    if (typeId === "city") return "settlement";
    if (typeId === "rp") return "exploration";
    if (typeId === "airbase") return "military";
    return typeId;
  }

  function toList(value) {
    if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
    return String(value || "").split(/\n|,/).map(v => v.trim()).filter(Boolean);
  }

  function normalizeBodyLore(value = {}) {
    return {
      diameter: value.diameter || "",
      atmosphere: value.atmosphere || "",
      rotationPeriod: value.rotationPeriod || "",
      orbitalPeriod: value.orbitalPeriod || "",
      climate: toList(value.climate),
      terrain: toList(value.terrain),
      nativeSpecies: toList(value.nativeSpecies || value.species),
      languages: toList(value.languages),
      government: toList(value.government),
      population: value.population || "",
      majorImports: value.majorImports || "",
      majorExports: value.majorExports || ""
    };
  }

  function listToEditorValue(value) {
    return toList(value).join("\n");
  }

  function listHtml(items) {
    const list = toList(items);
    if (!list.length) return "—";
    return `<ul>${list.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }

  function bodyNameIsProtected(body) {
    return Boolean(body && (
      body.type === "planet"
      || body.type === "star"
      || body.id === "rantel-cluster"
      || (body.type === "station" && body.parentBodyId === "rantel-cluster")
    ));
  }

  function canonicalProtectedBodyName(body) {
    if (!bodyNameIsProtected(body)) return body?.name || "";
    return seed.bodies?.find(item => item.id === body.id)?.name || body.name || "";
  }

  function migrateData(data) {
    const clone = deepClone(data && typeof data === "object" ? data : seed);
    clone.meta ??= {};
    clone.meta.version = "0.5.0-prototype";
    clone.meta.deletedBodyIds = Array.isArray(clone.meta.deletedBodyIds)
      ? [...new Set(clone.meta.deletedBodyIds.filter(Boolean))]
      : [];
    clone.meta.deletedFactionIds = Array.isArray(clone.meta.deletedFactionIds)
      ? [...new Set(clone.meta.deletedFactionIds.filter(Boolean))]
      : [];
    const deletedBodyIds = new Set(clone.meta.deletedBodyIds);
    const deletedFactionIds = new Set(clone.meta.deletedFactionIds);
    clone.visibilityStates = deepClone(seed.visibilityStates);
    clone.poiTypes = deepClone(seed.poiTypes);
    clone.modelTemplates = deepClone(seed.modelTemplates);
    clone.moonTemplates = mergeById(seed.moonTemplates, clone.moonTemplates);
    clone.factions = mergeByIdPreservingCustomOrder(
      (seed.factions || []).filter(faction => !deletedFactionIds.has(faction.id)),
      (clone.factions || []).filter(faction => !deletedFactionIds.has(faction.id))
    );
    clone.bodies = mergeById(
      (seed.bodies || []).filter(body => !deletedBodyIds.has(body.id)),
      (clone.bodies || []).filter(body => !deletedBodyIds.has(body.id))
    );
    clone.sectors = mergeById(seed.sectors || [], clone.sectors || []);
    clone.terrain = Array.isArray(clone.terrain) ? clone.terrain : deepClone(seed.terrain || []);
    clone.pois = Array.isArray(clone.pois) ? clone.pois : deepClone(seed.pois || []);

    // Harden older saves so a half-migrated localStorage file cannot blank the canvas.
    clone.bodies = clone.bodies
      .filter(body => body && body.id && body.type)
      .map(body => {
        const protectedName = canonicalProtectedBodyName(body);
        return {
          ...body,
          ...(bodyNameIsProtected(body)
            ? { name: protectedName, shortName: seed.bodies?.find(item => item.id === body.id)?.shortName || protectedName }
            : {}),
          lore: normalizeBodyLore(body.lore || body),
          ...(body.id === "rantel-cluster"
            ? { asteroidVisualCount: clamp(Math.round(Number(body.asteroidVisualCount ?? 340)), 100, 1200) }
            : {})
        };
      });
    clone.pois = clone.pois
      .filter(poi => poi && poi.id && poi.bodyId)
      .map(poi => ({
        visibility: "public",
        strategicTier: "minor",
        strategicValue: 0,
        tacticalValue: 0,
        textSize: 1,
        x: .5,
        y: .5,
        ...poi,
        type: normalizePoiTypeId(poi.type),
        visibility: normalizeVisibility(poi.visibility),
        factionId: clone.factions.some(f => f.id === poi.factionId) ? poi.factionId : clone.factions[0]?.id,
        strategicTier: STRATEGIC_TIERS.some(t => t.id === poi.strategicTier) ? poi.strategicTier : tierFromValue(Number(poi.strategicValue || 0)),
        x: clamp(Number(poi.x ?? .5), 0, 1),
        y: clamp(Number(poi.y ?? .5), 0, 1)
      }))
      .map(poi => {
        const customColor = poiUsesCustomColor(poi.type);
        return {
          ...poi,
          factionId: customColor ? (clone.factions.some(f => f.id === "neutral") ? "neutral" : clone.factions[0]?.id) : poi.factionId,
          color: poi.color || (customColor ? "#c7d2e0" : ""),
          strategicValue: customColor ? 0 : Number(poi.strategicValue || 0),
          textSize: clamp(Number(poi.textSize ?? 1), 0.5, 3),
          modelTemplateId: (clone.modelTemplates || []).some(t => t.id === (poi.modelTemplateId || poi.iconId) && t.type === normalizePoiTypeId(poi.type))
            ? (poi.modelTemplateId || poi.iconId)
            : (clone.modelTemplates || []).find(t => t.type === normalizePoiTypeId(poi.type))?.id || clone.modelTemplates[0]?.id
        };
      });
    return clone;
  }

  function mergeById(defaultItems = [], customItems = []) {
    const byId = new Map();
    for (const item of defaultItems || []) {
      if (item?.id) byId.set(item.id, deepClone(item));
    }
    for (const item of customItems || []) {
      if (!item?.id) continue;
      byId.set(item.id, { ...(byId.get(item.id) || {}), ...deepClone(item) });
    }
    return [...byId.values()];
  }

  function mergeByIdPreservingCustomOrder(defaultItems = [], customItems = []) {
    const defaults = new Map((defaultItems || []).filter(item => item?.id).map(item => [item.id, deepClone(item)]));
    const result = [];
    const seen = new Set();
    for (const item of customItems || []) {
      if (!item?.id || seen.has(item.id)) continue;
      result.push({ ...(defaults.get(item.id) || {}), ...deepClone(item) });
      seen.add(item.id);
    }
    for (const item of defaultItems || []) {
      if (!item?.id || seen.has(item.id)) continue;
      result.push(deepClone(item));
      seen.add(item.id);
    }
    return result;
  }

  const UNDO_COLLECTIONS = ["bodies", "factions", "pois", "terrain", "sectors", "modelTemplates", "poiTypes", "moonTemplates", "visibilityStates"];

  function invalidateDataCaches() {
    state.dataRevision += 1;
    state.controlCache.clear();
    state.sectorBonusCache.clear();
    state.systemControlCache.clear();
    state.systemBodySpriteCache.clear();
    state.systemOrbitLayerCache = null;
    state.planetBackgroundCache = null;
    state.staticControlsKey = "";
    for (const key of Object.keys(state.uiRenderKeys)) state.uiRenderKeys[key] = "";
    state.systemDirty = true;
    state.planetDirty = true;
  }

  function currentUndoUserKey() {
    const sharedKey = window.CC_LOGISTICS?.getCurrentUserKey?.();
    return String(sharedKey || `local-${state.role || "viewer"}`).replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  function undoStorageKey() {
    return `cc_atlas_last_save_v049_${currentUndoUserKey()}`;
  }

  function jsonEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  function collectionMap(items) {
    return new Map((Array.isArray(items) ? items : []).filter(item => item?.id).map(item => [item.id, item]));
  }

  function buildUndoPatch(before, after) {
    if (!before || !after || jsonEqual(before, after)) return null;
    const changes = [];
    for (const key of UNDO_COLLECTIONS) {
      const beforeItems = Array.isArray(before[key]) ? before[key] : [];
      const afterItems = Array.isArray(after[key]) ? after[key] : [];
      const beforeMap = collectionMap(beforeItems);
      const afterMap = collectionMap(afterItems);
      for (const [id, oldValue] of beforeMap) {
        if (!afterMap.has(id)) changes.push({ kind: "remove", collection: key, id, before: oldValue });
        else if (!jsonEqual(oldValue, afterMap.get(id))) changes.push({ kind: "update", collection: key, id, before: oldValue, after: afterMap.get(id) });
      }
      for (const [id, newValue] of afterMap) {
        if (!beforeMap.has(id)) changes.push({ kind: "add", collection: key, id, after: newValue });
      }
      const beforeOrder = beforeItems.map(item => item?.id).filter(Boolean);
      const afterOrder = afterItems.map(item => item?.id).filter(Boolean);
      if (!jsonEqual(beforeOrder, afterOrder)) changes.push({ kind: "order", collection: key, before: beforeOrder, after: afterOrder });
    }
    const collectionSet = new Set(UNDO_COLLECTIONS);
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (collectionSet.has(key)) continue;
      if (!jsonEqual(before[key], after[key])) changes.push({ kind: "root", key, before: before[key], after: after[key] });
    }
    if (!changes.length) return null;
    const named = changes.find(change => ["bodies","pois","terrain","factions"].includes(change.collection));
    const item = named?.after || named?.before;
    const label = item?.name ? `${item.name}` : `${changes.length} atlas change${changes.length === 1 ? "" : "s"}`;
    return { version: 1, createdAt: new Date().toISOString(), userKey: currentUndoUserKey(), label, changes };
  }

  function saveUndoPatch(patch) {
    if (!patch) return;
    try { localStorage.setItem(undoStorageKey(), JSON.stringify(patch)); }
    catch (err) { console.warn("Could not store last-save revert data.", err); }
  }

  function loadUndoPatch() {
    try { return JSON.parse(localStorage.getItem(undoStorageKey()) || "null"); }
    catch { return null; }
  }

  function clearUndoPatch() {
    localStorage.removeItem(undoStorageKey());
  }

  function reverseThreeWay(current, before, after) {
    if (jsonEqual(current, after)) return { value: deepClone(before), applied: true, conflicts: 0 };
    const beforeObject = before && typeof before === "object" && !Array.isArray(before);
    const afterObject = after && typeof after === "object" && !Array.isArray(after);
    const currentObject = current && typeof current === "object" && !Array.isArray(current);
    if (!beforeObject || !afterObject || !currentObject) return { value: current, applied: false, conflicts: 1 };
    const result = deepClone(current);
    let applied = false;
    let conflicts = 0;
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (jsonEqual(before[key], after[key])) continue;
      if (jsonEqual(current[key], after[key])) {
        if (before[key] === undefined) delete result[key];
        else result[key] = deepClone(before[key]);
        applied = true;
      } else {
        const nested = reverseThreeWay(current[key], before[key], after[key]);
        if (nested.applied) { result[key] = nested.value; applied = true; }
        conflicts += nested.conflicts;
      }
    }
    return { value: result, applied, conflicts };
  }

  function updateRevertButtonState() {
    if (!els.revertLastSaveBtn) return;
    const patch = loadUndoPatch();
    const allowed = ["command","admin","root"].includes(state.role);
    els.revertLastSaveBtn.disabled = !allowed || !patch?.changes?.length;
    if (els.revertSaveStatus) {
      els.revertSaveStatus.textContent = patch?.changes?.length
        ? `Last save: ${patch.label || "atlas change"} · ${new Date(patch.createdAt).toLocaleString()}`
        : "No saved change is available to revert for this account on this browser.";
    }
  }

  function revertLastUserSave() {
    const patch = loadUndoPatch();
    if (!patch?.changes?.length) return flashMessage("No saved change is available to revert for this account.");
    if (!["command","admin","root"].includes(state.role)) return flashMessage("Reverting a save requires Command, Admin, or Root access.");
    if (!confirm(`Revert your last save (${patch.label || "atlas change"})? Only fields that still match your saved version will be restored.`)) return;

    const next = deepClone(state.data);
    let applied = 0;
    let conflicts = 0;
    for (const change of [...patch.changes].reverse()) {
      if (change.kind === "root") {
        const result = reverseThreeWay(next[change.key], change.before, change.after);
        if (result.applied) { next[change.key] = result.value; applied += 1; }
        conflicts += result.conflicts;
        continue;
      }
      const items = Array.isArray(next[change.collection]) ? next[change.collection] : (next[change.collection] = []);
      const index = items.findIndex(item => item?.id === change.id);
      if (change.kind === "add") {
        if (index >= 0 && jsonEqual(items[index], change.after)) { items.splice(index, 1); applied += 1; }
        else conflicts += 1;
      } else if (change.kind === "remove") {
        if (index < 0) { items.push(deepClone(change.before)); applied += 1; }
        else conflicts += 1;
      } else if (change.kind === "update") {
        if (index < 0) { conflicts += 1; continue; }
        const result = reverseThreeWay(items[index], change.before, change.after);
        if (result.applied) { items[index] = result.value; applied += 1; }
        conflicts += result.conflicts;
      } else if (change.kind === "order") {
        const currentOrder = items.map(item => item?.id).filter(Boolean);
        if (jsonEqual(currentOrder, change.after)) {
          const byId = collectionMap(items);
          next[change.collection] = change.before.map(id => byId.get(id)).filter(Boolean);
          applied += 1;
        }
      }
    }
    if (!applied) return flashMessage("Nothing was reverted because the affected fields were changed again after your save.");
    state.data = migrateData(next);
    state.lastSavedJson = JSON.stringify(state.data);
    localStorage.setItem(STORAGE_KEY, state.lastSavedJson);
    invalidateDataCaches();
    clearUndoPatch();
    window.CC_LOGISTICS?.scheduleSiteSync?.();
    window.CC_LOGISTICS?.scheduleAtlasSave?.();
    state.planetDirty = true;
    renderAllPanels();
    flashMessage(conflicts ? `Reverted your last save. ${conflicts} field${conflicts === 1 ? " was" : "s were"} preserved because someone changed them afterward.` : "Your last save was reverted.");
  }

  function saveData(options = {}) {
    const afterJson = JSON.stringify(state.data);
    if (!options.skipUndo && state.lastSavedJson && state.lastSavedJson !== afterJson) {
      try { saveUndoPatch(buildUndoPatch(JSON.parse(state.lastSavedJson), state.data)); }
      catch (err) { console.warn("Could not build last-save revert data.", err); }
    }
    state.lastSavedJson = afterJson;
    localStorage.setItem(STORAGE_KEY, afterJson);
    invalidateDataCaches();
    updateRevertButtonState();
    window.CC_LOGISTICS?.scheduleSiteSync?.();
    window.CC_LOGISTICS?.scheduleAtlasSave?.();
  }

  function uuid(prefix = "id") {
    return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
  }

  function isStaff() {
    return ["admin", "root"].includes(state.role);
  }

  function isGmPlus() {
    return ["admin", "root"].includes(state.role);
  }

  function isAdmin() {
    return ["admin", "root"].includes(state.role);
  }

  function currentIntelIsActual() {
    return isGmPlus() && state.showHidden;
  }

  function roleLabel() {
    if (isGmPlus() && state.showHidden) return "Actual Control";
    return state.role === "root" ? "Root Intel" : state.role === "admin" ? "Admin Intel" : state.role === "command" ? "Command Intel" : "Public Intel";
  }

  function canSee(item) {
    const visibility = item.visibility || "public";
    if (visibility === "public" || visibility === "discovered") return true;
    if (isGmPlus() && state.showHidden) return true;
    return false;
  }

  function canEditPoi(poi) {
    if (isGmPlus()) return true;
    return state.role === "command" && normalizePoiTypeId(poi?.type) === "tactical";
  }

  function canCreatePoiType(typeId) {
    if (isGmPlus()) return true;
    return state.role === "command" && normalizePoiTypeId(typeId) === "tactical";
  }

  function bodyById(id) {
    return state.data.bodies.find(body => body.id === id);
  }

  function bodyHasTheater(body) {
    return Boolean(body && ["planet", "moon"].includes(body.type));
  }

  function firstTheaterBody() {
    return state.data.bodies.find(bodyHasTheater) || state.data.bodies.find(body => body.type === "planet");
  }

  function factionById(id) {
    return state.data.factions.find(faction => faction.id === id) || state.data.factions[0];
  }

  function typeById(id) {
    const normalized = normalizePoiTypeId(id);
    return state.data.poiTypes.find(type => type.id === normalized) || state.data.poiTypes.at(-1);
  }

  function templateById(id) {
    return state.data.modelTemplates.find(template => template.id === id) || state.data.modelTemplates[0];
  }

  function templatesForType(typeId) {
    const normalized = normalizePoiTypeId(typeId);
    return state.data.modelTemplates.filter(template => template.type === normalized);
  }

  function poiUsesCustomColor(typeId) {
    return ["exploration", "terrainHazard", "tactical"].includes(normalizePoiTypeId(typeId));
  }

  function poiRenderColor(poi) {
    if (poiUsesCustomColor(poi.type)) return poi.color || "#c7d2e0";
    return factionById(poi.factionId)?.color || "#c7d2e0";
  }

  function poisForBody(bodyId, opts = {}) {
    const { visibleOnly = true, includeChildBodies = false } = opts;
    const childIds = includeChildBodies
      ? state.data.bodies.filter(b => b.parentBodyId === bodyId).map(b => b.id)
      : [];
    return state.data.pois.filter(poi => {
      const matches = poi.bodyId === bodyId || childIds.includes(poi.bodyId);
      return matches && (!visibleOnly || canSee(poi));
    });
  }

  function bodiesForPlanetSelector() {
    return state.data.bodies.filter(bodyHasTheater);
  }

  function bodiesForBodyEditor() {
    return state.data.bodies.filter(body => ["star", "planet", "moon", "station", "asteroid_belt"].includes(body.type));
  }

  function bodiesForPoiSelector() {
    return state.data.bodies.filter(body => ["planet", "moon", "station", "asteroid_belt"].includes(body.type));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) return "0%";
    return `${Math.round(value * 10) / 10}%`;
  }

  function tacticalRoleRestrictionMessage() {
    return "Command Mode can create Tactical Point POIs only. Admin and Root can place and edit all points.";
  }

  function init() {
    bindEvents();
    populateStaticControls();
    loadTextures();
    renderAllPanels();
    requestAnimationFrame(loop);
  }

  function bindEvents() {
    els.tabButtons.forEach(button => {
      button.addEventListener("click", () => setView(button.dataset.view));
    });

    els.settingsBtn?.addEventListener("click", () => toggleSettingsMenu(true));
    els.settingsCloseBtn?.addEventListener("click", () => toggleSettingsMenu(false));
    els.revertLastSaveBtn?.addEventListener("click", revertLastUserSave);
    els.viewerModeBtn?.addEventListener("click", () => setRoleMode("viewer"));
    els.disableSatellites?.addEventListener("change", () => updateUserSetting("disableSatellites", els.disableSatellites.checked));
    els.disableSatelliteNames?.addEventListener("change", () => updateUserSetting("disableSatelliteNames", els.disableSatelliteNames.checked));
    els.disableNames?.addEventListener("change", () => updateUserSetting("disableNames", els.disableNames.checked));
    els.disablePois?.addEventListener("change", () => updateUserSetting("disablePois", els.disablePois.checked));
    els.disablePoiIcons?.addEventListener("change", () => updateUserSetting("disablePoiIcons", els.disablePoiIcons.checked));
    els.disablePoiRendering?.addEventListener("change", () => updateUserSetting("disablePoiRendering", els.disablePoiRendering.checked));
    els.showHiddenSettings?.addEventListener("change", () => updateHiddenIntelSetting(els.showHiddenSettings.checked));
    els.commandModeBtn?.addEventListener("click", () => setRoleMode("command"));
    els.adminModeBtn?.addEventListener("click", () => setRoleMode("admin"));
    els.rootModeBtn?.addEventListener("click", () => setRoleMode("root"));
    els.passwordForm?.addEventListener("submit", onPasswordSubmit);
    document.addEventListener("click", (event) => {
      if (!event.target.closest?.(".settings-block")) toggleSettingsMenu(false);
    });

    window.addEventListener("resize", () => {
      if (state.resizeFrame) return;
      state.resizeFrame = requestAnimationFrame(() => {
        state.resizeFrame = 0;
        state.systemBackgroundCache = null;
        state.planetBackgroundCache = null;
        state.systemOrbitLayerCache = null;
        state.systemBodySpriteCache.clear();
        state.systemDirty = true;
        state.planetDirty = true;
      });
    }, { passive: true });

    els.pauseOrbitBtn.addEventListener("click", () => {
      state.paused = !state.paused;
      els.pauseOrbitBtn.textContent = state.paused ? "Resume Orbits" : "Pause Orbits";
    });

    els.resetViewBtn.addEventListener("click", () => {
      state.selectedBodyId = "brekka";
      state.selectedPoiId = null;
      resetCameras();
      state.planetDirty = true;
      renderAllPanels();
    });

    els.toggleIntelBtn.addEventListener("click", () => {
      if (!isGmPlus()) {
        flashMessage("Hidden intel is available to Admin and Root Mode only.");
        return;
      }
      state.showHidden = !state.showHidden;
      els.showHidden.checked = state.showHidden;
      renderAllPanels();
    });

    els.systemCanvas.addEventListener("mousemove", event => scheduleHover("system", event));
    els.systemCanvas.addEventListener("mouseleave", clearHover);
    els.systemCanvas.addEventListener("click", onSystemClick);

    els.planetCanvas.addEventListener("mousemove", event => scheduleHover("planet", event));
    els.planetCanvas.addEventListener("mouseleave", clearHover);
    els.planetCanvas.addEventListener("click", onPlanetClick);
    els.planetCanvas.addEventListener("contextmenu", onPlanetContextMenu);
    els.planetCanvas.addEventListener("auxclick", onPlanetAuxClick);

    bindCameraControls(els.systemCanvas, "system");
    bindCameraControls(els.planetCanvas, "planet");

    els.planetSelect.addEventListener("change", () => {
      state.selectedBodyId = els.planetSelect.value;
      state.selectedPoiId = null;
      state.selectedTerrainId = null;
      resetPlanetCamera();
      state.planetDirty = true;
      renderAllPanels();
    });

    els.planetZoomInBtn?.addEventListener("click", () => {
      zoomPlanetFromCenter(-1);
    });
    els.planetZoomOutBtn?.addEventListener("click", () => {
      zoomPlanetFromCenter(1);
    });
    els.planetFitBtn?.addEventListener("click", () => {
      resetPlanetCamera();
      renderPlanet();
    });
    els.planetFlatModeBtn?.addEventListener("click", () => setPlanetViewMode("flat"));
    els.planetGlobeModeBtn?.addEventListener("click", () => setPlanetViewMode("globe"));

    els.showTerrain?.addEventListener("change", () => { state.showTerrain = els.showTerrain.checked; state.planetDirty = true; renderPlanet(); });
    els.showPOIs?.addEventListener("change", () => { state.showPOIs = els.showPOIs.checked; state.planetDirty = true; renderPlanet(); });
    els.showHidden.addEventListener("change", () => updateHiddenIntelSetting(els.showHidden.checked));
    els.placementMode.addEventListener("change", () => {
      if (!isStaff()) {
        els.placementMode.checked = false;
        flashMessage("Placement mode requires a staff role.");
        return;
      }
      state.placementMode = els.placementMode.checked;
      els.placementReadout.textContent = state.placementMode
        ? `Placement mode armed. Click the visible ${state.planetViewMode === "flat" ? "map" : "globe surface"} to capture POI coordinates.`
        : "Click map or globe to capture coordinates.";
    });

    els.factionForm.addEventListener("submit", onFactionSubmit);
    els.mergeFactionBtn?.addEventListener("click", mergeSelectedFaction);
    els.factionMergeSource?.addEventListener("change", keepFactionMergeTargetsDistinct);
    els.factionMergeTarget?.addEventListener("change", keepFactionMergeTargetsDistinct);
    els.poiForm.addEventListener("submit", onPoiSubmit);
    els.newPoiBtn.addEventListener("click", clearPoiForm);
    els.deletePoiBtn.addEventListener("click", onDeletePoi);
    els.poiModel?.addEventListener("change", () => updateIconPreview(els.poiModel, els.poiIconPreview, els.poiOwner, els.poiColor, els.poiType));
    els.poiType?.addEventListener("change", () => { refreshIconSelect(els.poiModel, els.poiType.value); updatePoiFormMode(); updatePoiFormMode();
    updateIconPreview(els.poiModel, els.poiIconPreview, els.poiOwner, els.poiColor, els.poiType); });
    els.poiOwner?.addEventListener("change", () => updateIconPreview(els.poiModel, els.poiIconPreview, els.poiOwner, els.poiColor, els.poiType));
    els.poiColor?.addEventListener("input", () => updateIconPreview(els.poiModel, els.poiIconPreview, els.poiOwner, els.poiColor, els.poiType));
    els.poiStrategicTier?.addEventListener("change", () => applyTierToInput(els.poiStrategicTier, els.poiStrategic));
    els.quickPoiForm?.addEventListener("submit", onQuickPoiSubmit);
    els.quickPoiCloseBtn?.addEventListener("click", hideQuickPoiEditor);
    els.quickPoiFullEditBtn?.addEventListener("click", openQuickPoiFullEdit);
    els.quickPoiDeleteBtn?.addEventListener("click", deleteQuickPoi);
    els.quickPoiIcon?.addEventListener("change", () => updateIconPreview(els.quickPoiIcon, els.quickPoiIconPreview, els.quickPoiOwner, els.quickPoiColor, els.quickPoiType));
    els.quickPoiType?.addEventListener("change", () => { refreshIconSelect(els.quickPoiIcon, els.quickPoiType.value); updateQuickPoiFormMode(); updateIconPreview(els.quickPoiIcon, els.quickPoiIconPreview, els.quickPoiOwner, els.quickPoiColor, els.quickPoiType); });
    els.quickPoiOwner?.addEventListener("change", () => updateIconPreview(els.quickPoiIcon, els.quickPoiIconPreview, els.quickPoiOwner, els.quickPoiColor, els.quickPoiType));
    els.quickPoiColor?.addEventListener("input", () => updateIconPreview(els.quickPoiIcon, els.quickPoiIconPreview, els.quickPoiOwner, els.quickPoiColor, els.quickPoiType));
    els.quickPoiStrategicTier?.addEventListener("change", () => applyTierToInput(els.quickPoiStrategicTier, els.quickPoiStrategic));
    document.addEventListener("click", (event) => {
      if (!event.target.closest?.("#quickPoiMenu") && !event.target.closest?.("#quickPoiEditor")) hideQuickPoiMenu();
    });
    els.moonForm.addEventListener("submit", onMoonSubmit);
    els.terrainForm?.addEventListener("submit", onTerrainSubmit);
    els.newTerrainBtn?.addEventListener("click", clearTerrainForm);
    els.deleteTerrainBtn?.addEventListener("click", onDeleteTerrain);
    els.bodyForm?.addEventListener("submit", onBodySubmit);
    els.deleteBodyBtn?.addEventListener("click", onDeleteBody);
    els.bodyEditSelect?.addEventListener("change", () => loadBodyIntoForm(els.bodyEditSelect.value));
    els.bodyEditAsteroidDensity?.addEventListener("input", updateAsteroidDensityReadout);
    els.bodyEditControlOverride?.addEventListener("change", updateBodyControlOverrideAvailability);
    els.bodyEditControlFields?.addEventListener("input", updateBodyControlOverrideTotal);
    els.exportDataBtn.addEventListener("click", onExportData);
    els.importDataInput.addEventListener("change", onImportData);
    els.resetDataBtn.addEventListener("click", onResetData);
    els.closeDialogBtn.addEventListener("click", () => els.detailDialog.close());
    document.addEventListener("click", (event) => {
      const button = event.target.closest?.("[data-open-theater-body]");
      if (!button) return;
      const body = bodyById(button.dataset.openTheaterBody);
      if (!bodyHasTheater(body)) {
        flashMessage("This asset has no planetary theater. Rantel nodes and waystations are inspected through strategic briefings and POIs.");
        return;
      }
      openTheater(body.id);
    });
  }


  function toggleSettingsMenu(force) {
    if (!els.settingsMenu) return;
    const show = typeof force === "boolean" ? force : els.settingsMenu.classList.contains("hidden");
    els.settingsMenu.classList.toggle("hidden", !show);
  }

  function updateUserSetting(key, value) {
    state.settings[key] = Boolean(value);
    saveSettings();
    state.planetDirty = true;
    renderAllPanels();
  }

  function updateHiddenIntelSetting(value) {
    if (!isAdmin() && value) {
      if (els.showHiddenSettings) els.showHiddenSettings.checked = false;
      if (els.showHidden) els.showHidden.checked = false;
      flashMessage("Hidden intel is available to Admin and Root Mode only.");
      return;
    }
    state.showHidden = Boolean(value) && isAdmin();
    if (els.showHidden) els.showHidden.checked = state.showHidden;
    if (els.showHiddenSettings) els.showHiddenSettings.checked = state.showHidden;
    renderAllPanels();
  }

  function setRoleMode(role) {
    role = normalizeRole(role);
    if (role === "viewer") {
      state.role = "viewer";
    } else if (role === "command" && !state.passwords.command) {
      state.role = "command";
    } else {
      const password = prompt(`Enter ${ROLE_LABELS[role]} Mode password:`);
      if (password !== state.passwords[role]) {
        flashMessage(`${ROLE_LABELS[role]} Mode password rejected.`);
        renderSettingsState();
        return;
      }
      state.role = role;
    }
    localStorage.setItem("cc_role", state.role);
    if (!isAdmin()) {
      state.showHidden = false;
      if (els.showHidden) els.showHidden.checked = false;
      if (els.showHiddenSettings) els.showHiddenSettings.checked = false;
      if (state.activeView === "admin") state.activeView = "system";
    }
    toggleSettingsMenu(false);
    renderAllPanels();
  }

  function renderSettingsState() {
    state.settings.poiTypeFilters ??= {};
    if (els.disableSatellites) els.disableSatellites.checked = Boolean(state.settings.disableSatellites);
    if (els.disableSatelliteNames) els.disableSatelliteNames.checked = Boolean(state.settings.disableSatelliteNames);
    if (els.disableNames) els.disableNames.checked = Boolean(state.settings.disableNames);
    if (els.disablePois) els.disablePois.checked = Boolean(state.settings.disablePois);
    if (els.disablePoiIcons) els.disablePoiIcons.checked = Boolean(state.settings.disablePoiIcons);
    if (els.disablePoiRendering) els.disablePoiRendering.checked = Boolean(state.settings.disablePoiRendering);
    if (els.poiTypeFilterSettings) {
      els.poiTypeFilterSettings.innerHTML = state.data.poiTypes.map(type => {
        const checked = state.settings.poiTypeFilters[type.id] !== false ? "checked" : "";
        return `<label><input type="checkbox" data-poi-filter-type="${escapeHtml(type.id)}" ${checked} /> ${escapeHtml(type.label)}</label>`;
      }).join("");
      els.poiTypeFilterSettings.querySelectorAll("[data-poi-filter-type]").forEach(input => {
        input.addEventListener("change", () => {
          state.settings.poiTypeFilters[input.dataset.poiFilterType] = input.checked;
          saveSettings();
          state.planetDirty = true;
          renderAllPanels();
        });
      });
    }
    [els.viewerModeBtn, els.commandModeBtn, els.adminModeBtn, els.rootModeBtn].forEach(btn => btn?.classList.remove("active"));
    ({ viewer: els.viewerModeBtn, command: els.commandModeBtn, admin: els.adminModeBtn, root: els.rootModeBtn }[state.role] || els.viewerModeBtn)?.classList.add("active");
    if (els.modeReadout) els.modeReadout.textContent = `Current mode: ${modeLabel()}`;
    updateRevertButtonState();
    els.showHiddenSettingsWrap?.classList.toggle("hidden", !isAdmin());
    if (els.showHiddenSettings) { els.showHiddenSettings.disabled = !isAdmin(); els.showHiddenSettings.checked = isAdmin() && state.showHidden; }
    if (els.commandPasswordInput) els.commandPasswordInput.value = state.passwords.command || "";
    if (els.adminPasswordInput) els.adminPasswordInput.value = state.passwords.admin || "";
    if (els.rootPasswordInput) els.rootPasswordInput.value = state.passwords.root || "";
  }

  function onPasswordSubmit(event) {
    event.preventDefault();
    if (!isRoot()) return flashMessage("Password changes require Root Mode.");
    state.passwords.command = els.commandPasswordInput.value || DEFAULT_PASSWORDS.command;
    state.passwords.admin = els.adminPasswordInput.value || DEFAULT_PASSWORDS.admin;
    state.passwords.root = els.rootPasswordInput.value || DEFAULT_PASSWORDS.root;
    savePasswords();
    flashMessage("Mode passwords updated for this browser.");
    renderSettingsState();
  }

  function setView(view) {
    if (view === "admin" && !isAdmin()) {
      flashMessage("Admin Console requires Admin or Root Mode.");
      view = "system";
    }
    if (view === "planet") {
      const selected = bodyById(state.selectedBodyId);
      if (!bodyHasTheater(selected)) {
        const fallback = firstTheaterBody();
        if (fallback) state.selectedBodyId = fallback.id;
        state.selectedPoiId = null;
      }
    }
    state.activeView = view;
    if (view === "system") state.systemDirty = true;
    els.tabButtons.forEach(button => button.classList.toggle("active", button.dataset.view === view));
    els.systemView.classList.toggle("active-view", view === "system");
    els.planetView.classList.toggle("active-view", view === "planet");
    els.logisticsView?.classList.toggle("active-view", view === "logistics");
    els.adminView.classList.toggle("active-view", view === "admin");
    document.getElementById("app-shell")?.classList.toggle("logistics-mode", view === "logistics");

    renderAllPanels();
  }


function setPlanetViewMode(mode) {
  state.planetViewMode = mode === "globe" ? "globe" : "flat";
  localStorage.setItem("cc_planet_view_mode", state.planetViewMode);
  resetPlanetCamera();
  updatePlanetViewUi();
  state.planetDirty = true;
  if (state.activeView === "planet") renderPlanet();
}

function updatePlanetViewUi() {
  const flatActive = state.planetViewMode !== "globe";
  els.planetFlatModeBtn?.classList.toggle("active", flatActive);
  els.planetGlobeModeBtn?.classList.toggle("active", !flatActive);
  els.planetFlatModeBtn?.setAttribute("aria-pressed", flatActive ? "true" : "false");
  els.planetGlobeModeBtn?.setAttribute("aria-pressed", !flatActive ? "true" : "false");
  if (els.planetModeHint) {
    els.planetModeHint.textContent = flatActive
      ? "Wheel zoom · drag pan · click/right-click POI"
      : "Wheel zoom · drag rotate · Shift/right-drag pan · click/right-click POI";
  }
  if (els.placementReadout && !state.placementMode) {
    els.placementReadout.textContent = "Click map or globe to capture coordinates.";
  }
}

  function openTheater(bodyId) {
    const body = bodyById(bodyId);
    if (!bodyHasTheater(body)) {
      flashMessage("Only planets and moons currently have globe theaters.");
      return;
    }
    state.selectedBodyId = body.id;
    state.selectedPoiId = null;
    state.planetRotation = { lon: -0.35, lat: 0.10 };
    resetPlanetCamera();
    state.planetDirty = true;
    els.detailDialog?.close?.();
    setView("planet");
  }

  function populateStaticControls() {
    const controlsKey = `${state.dataRevision}:${state.role}`;
    if (state.staticControlsKey === controlsKey) {
      els.planetSelect.value = state.selectedBodyId;
      if (bodiesForPoiSelector().some(body => body.id === state.selectedBodyId)) els.poiBody.value = state.selectedBodyId;
      if (els.terrainBody && bodiesForPlanetSelector().some(body => body.id === state.selectedBodyId)) els.terrainBody.value = state.selectedBodyId;
      if (els.bodyEditSelect && bodiesForBodyEditor().some(body => body.id === state.selectedBodyId)) els.bodyEditSelect.value = state.selectedBodyId;
      return;
    }
    state.staticControlsKey = controlsKey;
    populateSelect(els.planetSelect, bodiesForPlanetSelector(), "id", "name");
    populateSelect(els.poiBody, bodiesForPoiSelector(), "id", "name");
    populateSelect(els.poiType, state.data.poiTypes, "id", "label");
    populateSelect(els.poiStrategicTier, STRATEGIC_TIERS, "id", "label");
    populateSelect(els.poiOwner, state.data.factions, "id", "name");
    populateSelect(els.poiVisibility, state.data.visibilityStates, "id", "label");
    populateSelect(els.quickPoiType, state.data.poiTypes, "id", "label");
    populateSelect(els.quickPoiOwner, state.data.factions, "id", "name");
    populateSelect(els.quickPoiVisibility, state.data.visibilityStates, "id", "label");
    populateSelect(els.quickPoiStrategicTier, STRATEGIC_TIERS, "id", "label");
    populateSelect(els.moonParent, state.data.bodies.filter(b => b.type === "planet"), "id", "name");
    if (els.moonTemplate) populateSelect(els.moonTemplate, state.data.moonTemplates, "id", "label");
    if (els.terrainBody) populateSelect(els.terrainBody, bodiesForPlanetSelector(), "id", "name");
    if (els.bodyEditSelect) populateSelect(els.bodyEditSelect, bodiesForBodyEditor(), "id", "name");

    els.planetSelect.value = state.selectedBodyId;
    els.poiBody.value = state.selectedBodyId;
    if (els.terrainBody && bodiesForPlanetSelector().some(body => body.id === state.selectedBodyId)) els.terrainBody.value = state.selectedBodyId;
    if (els.bodyEditSelect && bodiesForBodyEditor().some(body => body.id === state.selectedBodyId)) els.bodyEditSelect.value = state.selectedBodyId;
    if (els.bodyEditSelect && !els.bodyEditName?.value) loadBodyIntoForm(els.bodyEditSelect.value || bodiesForBodyEditor()[0]?.id);

    refreshIconSelect(els.poiModel, els.poiType.value, els.poiModel.value);
    refreshIconSelect(els.quickPoiIcon, els.quickPoiType.value, els.quickPoiIcon.value);
    updateIconPreview(els.poiModel, els.poiIconPreview, els.poiOwner, els.poiColor, els.poiType);
    updateIconPreview(els.quickPoiIcon, els.quickPoiIconPreview, els.quickPoiOwner, els.quickPoiColor, els.quickPoiType);

    renderLegendIcons();
    updatePoiFormMode();
    updateQuickPoiFormMode();
    renderBodyIntelPanel();
  }

  function populateSelect(select, items, valueKey, labelKey) {
    if (!select) return;
    const current = select.value;
    const signature = items.map(item => `${item[valueKey]}:${item[labelKey]}`).join("|");
    if (select.dataset.optionSignature !== signature) {
      select.innerHTML = items.map(item => `<option value="${escapeHtml(item[valueKey])}">${escapeHtml(item[labelKey])}</option>`).join("");
      select.dataset.optionSignature = signature;
    }
    if (items.some(item => item[valueKey] === current)) select.value = current;
  }


  function refreshIconSelect(select, typeId, preferredId = "") {
    if (!select) return;
    const options = templatesForType(typeId);
    const desired = preferredId || select.value || defaultIconForType(typeId);
    const signature = options.map(item => `${item.id}:${item.label}`).join("|");
    if (select.dataset.optionSignature !== signature) {
      select.innerHTML = options.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("");
      select.dataset.optionSignature = signature;
    }
    select.value = options.some(item => item.id === desired) ? desired : (options[0]?.id || "");
  }

  function renderLegendIcons() {
    els.poiLegend?.querySelectorAll?.("[data-legend-icon]")?.forEach(node => {
      renderIconChip(node, node.dataset.legendIcon, "#c7d2e0", 22);
    });
  }

  function satellitesForBody(bodyId) {
    return state.data.bodies.filter(body => body.parentBodyId === bodyId || body.orbitParentId === bodyId);
  }

  function formatIntelValue(value) {
    if (Array.isArray(value)) return listHtml(value);
    return escapeHtml(value || "—");
  }

  function renderBodyIntelPanel() {
    if (!els.bodyIntel) return;
    const body = bodyById(state.selectedBodyId) || firstTheaterBody();
    if (!body) {
      els.bodyIntel.innerHTML = `<p class="selected-info">No body selected.</p>`;
      return;
    }
    const lore = normalizeBodyLore(body.lore || {});
    const sats = satellitesForBody(body.id).map(sat => sat.name);
    const rows = [
      ["Satellites", sats.length ? sats : ["None registered"]],
      ["Diameter", lore.diameter],
      ["Atmosphere", lore.atmosphere],
      ["Rotation Period", lore.rotationPeriod],
      ["Orbital Period", lore.orbitalPeriod],
      ["Climate", lore.climate],
      ["Terrain", lore.terrain],
      ["Native Species", lore.nativeSpecies],
      ["Languages", lore.languages],
      ["Government", lore.government],
      ["Population", lore.population],
      ["Major Imports", lore.majorImports],
      ["Major Exports", lore.majorExports]
    ];
    els.bodyIntel.innerHTML = rows.map(([label, value]) => `
      <div class="body-intel-entry"><strong>${escapeHtml(label)}</strong>${formatIntelValue(value)}</div>
    `).join("");
  }

  function renderAllPanels() {
    populateStaticControls();
    renderSettingsState();
    els.tabButtons.find(button => button.dataset.view === "admin")?.classList.toggle("hidden", !isAdmin());
    if (state.activeView === "admin" && !isAdmin()) {
      setView("system");
      return;
    }
    els.toggleIntelBtn?.classList.toggle("hidden", !isAdmin());
    els.showHidden.closest?.("label")?.classList.add("hidden");
    els.showHidden.disabled = !isAdmin();
    els.showHidden.checked = isAdmin() && state.showHidden;
    if (els.showHiddenSettings) els.showHiddenSettings.checked = isAdmin() && state.showHidden;
    els.placementMode.checked = state.placementMode;
    els.quickPoiTools?.classList.toggle("hidden", !isAdmin());
    els.placementMode?.closest?.("label")?.classList.add("hidden");
    els.placementReadout?.classList.add("hidden");
    els.planetSelect.value = state.selectedBodyId;

    const intelMode = `${state.role}:${state.showHidden ? 1 : 0}`;
    const systemControlKey = `${state.dataRevision}:${intelMode}`;
    if (state.uiRenderKeys.systemControl !== systemControlKey) {
      state.uiRenderKeys.systemControl = systemControlKey;
      renderSystemControlPanel();
    }

    const selectedKey = `${state.dataRevision}:${intelMode}:${state.selectedBodyId || ""}:${state.selectedPoiId || ""}:${state.selectedTerrainId || ""}`;
    if (state.uiRenderKeys.selected !== selectedKey) {
      state.uiRenderKeys.selected = selectedKey;
      renderSelectedPanel();
    }

    const poiListKey = `${state.dataRevision}:${intelMode}:${state.selectedBodyId || ""}`;
    if (state.uiRenderKeys.poiList !== poiListKey) {
      state.uiRenderKeys.poiList = poiListKey;
      renderPoiList();
    }

    if (state.activeView === "admin" && isAdmin()) {
      const adminKey = `${state.dataRevision}:${state.role}`;
      if (state.uiRenderKeys.admin !== adminKey) {
        state.uiRenderKeys.admin = adminKey;
        renderAdminLists();
      }
      renderAdminAccessState();
    }

    updatePlanetViewUi();
    const bodyIntelKey = `${state.dataRevision}:${state.selectedBodyId || ""}`;
    if (state.uiRenderKeys.bodyIntel !== bodyIntelKey) {
      state.uiRenderKeys.bodyIntel = bodyIntelKey;
      renderBodyIntelPanel();
    }
    if (state.activeView === "logistics" || state.activeView === "admin") window.CC_LOGISTICS?.render?.();

    const visualKey = `${state.activeView}:${state.dataRevision}:${intelMode}:${state.selectedBodyId || ""}:${state.selectedPoiId || ""}:${state.selectedTerrainId || ""}:${state.planetViewMode}:${JSON.stringify(state.settings)}`;
    if (state.lastVisualRenderKey !== visualKey) {
      state.lastVisualRenderKey = visualKey;
      state.systemDirty = true;
      state.planetDirty = true;
    }
    if (state.activeView === "planet" && state.planetDirty) renderPlanet();
  }

  function flashMessage(message) {
    state.uiRenderKeys.selected = "";
    els.selectedTitle.textContent = "Command Notice";
    els.selectedInfo.innerHTML = `<p>${escapeHtml(message)}</p>`;
  }

  function resizeCanvas(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width, height, dpr };
  }

  function loop(now) {
    const rawDt = Math.min(100, now - state.lastFrame);
    state.lastFrame = now;
    if (document.hidden) {
      requestAnimationFrame(loop);
      return;
    }

    const selectedPlanetBody = bodyById(state.selectedBodyId);
    const animatePlanetSatellites = state.activeView === "planet"
      && state.planetViewMode === "globe"
      && !state.settings.disableSatellites
      && !state.paused
      && state.planetCamera.zoom <= 0.72
      && Boolean(selectedPlanetBody && state.data.bodies.some(body => body.parentBodyId === selectedPlanetBody.id));

    if (!state.paused && (state.activeView === "system" || animatePlanetSatellites)) state.animationTime += rawDt;

    if (state.activeView === "system") {
      const dragging = state.dragCamera?.view === "system";
      const targetFps = dragging ? 60 : (state.systemRenderCost > 18 ? 30 : state.systemRenderCost > 11 ? 45 : 60);
      const interval = 1000 / targetFps;
      if (state.systemDirty || (!state.paused && now - state.lastSystemRender >= interval)) {
        try {
          const renderStarted = performance.now();
          renderSystem(now);
          const renderCost = performance.now() - renderStarted;
          state.systemRenderCost = state.systemRenderCost ? state.systemRenderCost * .82 + renderCost * .18 : renderCost;
          state.lastSystemRender = now;
          state.systemDirty = false;
        } catch (err) {
          console.error("System map render failed", err);
          drawCanvasNotice(els.systemCanvas, systemCtx, "System map render failed", err.message || String(err));
        }
      }
    }

    if (state.activeView === "planet" && (state.planetDirty || animatePlanetSatellites)) {
      const planetDragging = state.dragCamera?.view === "planet";
      const planetInterval = planetDragging ? 1000 / 60 : (animatePlanetSatellites ? 1000 / 45 : 0);
      if (!planetInterval || now - state.lastPlanetRender >= planetInterval) {
        try {
          renderPlanet();
          state.lastPlanetRender = now;
        } catch (err) {
          console.error("Planet map render failed", err);
          drawCanvasNotice(els.planetCanvas, planetCtx, "Planet theater render failed", err.message || String(err));
        }
      }
    }
    requestAnimationFrame(loop);
  }

  function drawCanvasNotice(canvas, ctx, title, detail) {
    const { width, height } = resizeCanvas(canvas, ctx);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(2, 8, 16, .92)";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(109, 247, 255, .86)";
    ctx.font = "18px Arial Narrow, Bahnschrift, sans-serif";
    ctx.fillText(title, 28, 42);
    ctx.fillStyle = "rgba(200, 220, 238, .78)";
    ctx.font = "13px Arial Narrow, Bahnschrift, sans-serif";
    ctx.fillText(detail, 28, 68);
    ctx.fillText("Try Admin Console → Reset Seed Data, or export/import a clean JSON file.", 28, 92);
  }

  function renderSystem() {
    const { width, height } = resizeCanvas(els.systemCanvas, systemCtx);
    const ctx = systemCtx;
    ctx.clearRect(0, 0, width, height);
    drawStarfield(ctx, width, height);

    const center = { x: width * 0.5, y: height * 0.53 };
    const scale = Math.min(width / 1650, height / 1120);
    state.bodyPositions.clear();
    state.systemHits = [];

    ctx.save();
    applyCamera(ctx, state.systemCamera, width, height);

    drawOrbitRings(ctx, center, scale);
    drawAsteroidBelt(ctx, center, scale);

    const star = bodyById("osiris-star") || { id: "osiris-star", type: "star", name: "Osiris", radius: 54, colorA: "#ff3800", colorB: "#fff06a" };
    state.bodyPositions.set(star.id, { x: center.x, y: center.y, r: star.radius * scale, body: star });
    drawBody(ctx, star, center.x, center.y, Math.max(34, star.radius * scale), 1);
    state.systemHits.push({ kind: "body", id: star.id, x: center.x, y: center.y, r: Math.max(34, star.radius * scale) + 6 });

    const primaryBodies = state.data.bodies.filter(body =>
      body.type === "planet" || (body.type === "station" && (!body.parentBodyId || body.parentBodyId === "rantel-cluster"))
    );
    for (const body of primaryBodies) {
      const pos = orbitalPosition(body, center, scale);
      state.bodyPositions.set(body.id, { ...pos, r: body.radius * scale, body });
    }

    const satellites = state.settings.disableSatellites ? [] : state.data.bodies.filter(body => body.parentBodyId && body.parentBodyId !== "rantel-cluster");
    for (const satellite of satellites) {
      const parentPos = state.bodyPositions.get(satellite.parentBodyId);
      if (!parentPos) continue;
      const pos = satellitePosition(satellite, parentPos, scale);
      state.bodyPositions.set(satellite.id, { ...pos, r: satellite.radius * scale, body: satellite });
    }

    if (!state.settings.disableSatellites) drawSatelliteOrbits(ctx, scale);

    const drawableBodies = [...state.bodyPositions.values()]
      .filter(pos => pos.body.id !== "osiris-star")
      .sort((a, b) => a.y - b.y);

    for (const pos of drawableBodies) {
      if (state.settings.disableSatellites && pos.body.parentBodyId && pos.body.parentBodyId !== "rantel-cluster") continue;
      drawBody(ctx, pos.body, pos.x, pos.y, Math.max(6, pos.r), scale);
      drawSystemLabel(ctx, pos.body, pos.x, pos.y, Math.max(6, pos.r));
      state.systemHits.push({ kind: "body", id: pos.body.id, x: pos.x, y: pos.y, r: Math.max(15, pos.r + 8) });
    }

    drawSelectedBodyHalo(ctx, center, scale);
    ctx.restore();

    drawSystemAnnotations(ctx, width, height, scale);
  }

  function drawStarfield(ctx, width, height) {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    let cache = state.systemBackgroundCache;
    if (!cache || cache.width !== w || cache.height !== h) {
      cache = document.createElement("canvas");
      cache.width = w;
      cache.height = h;
      const cctx = cache.getContext("2d", { alpha: false });
      const grd = cctx.createRadialGradient(w * .52, h * .44, 60, w * .52, h * .52, Math.max(w, h));
      grd.addColorStop(0, "rgba(10, 28, 52, 0.7)");
      grd.addColorStop(.42, "rgba(3, 7, 15, 0.82)");
      grd.addColorStop(1, "rgba(0, 1, 5, 1)");
      cctx.fillStyle = grd;
      cctx.fillRect(0, 0, w, h);
      const count = Math.floor((w * h) / 5400);
      cctx.fillStyle = "rgba(235,248,255,.72)";
      for (let i = 0; i < count; i++) {
        const p = pseudoPoint(i);
        cctx.globalAlpha = .28 + p.z * .72;
        const size = p.z > .95 ? 1.9 : 1.05;
        cctx.fillRect(p.x * w, p.y * h, size, size);
      }
      cctx.globalAlpha = 1;
      state.systemBackgroundCache = cache;
    }
    ctx.drawImage(cache, 0, 0, width, height);
  }

  function drawOrbitRings(ctx, center, scale) {
    const rings = state.data.bodies
      .filter(body => (body.type === "planet" || body.type === "asteroid_belt" || (body.type === "station" && (!body.parentBodyId || body.parentBodyId === "rantel-cluster"))) && body.orbitRadius)
      .map(body => body.orbitRadius)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .sort((a, b) => a - b);

    ctx.save();
    ctx.strokeStyle = "rgba(130, 210, 255, 0.16)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 9]);
    for (const orbit of rings) {
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, orbit * scale, orbit * scale * 0.64, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function asteroidBeltLayer(belt, radius, scale) {
    const asteroidCount = clamp(Math.round(Number(belt.asteroidVisualCount ?? 340)), 100, 1200);
    const radiusKey = Math.max(1, Math.round(radius));
    const key = `${asteroidCount}:${radiusKey}`;
    if (state.systemOrbitLayerCache?.key === key) return state.systemOrbitLayerCache;

    const padding = Math.ceil(72 * Math.max(.65, scale));
    const half = Math.ceil(radius + padding);
    const canvas = document.createElement("canvas");
    canvas.width = half * 2;
    canvas.height = half * 2;
    const layerCtx = canvas.getContext("2d");
    layerCtx.strokeStyle = "rgba(210, 230, 255, 0.18)";
    layerCtx.lineWidth = 1;
    layerCtx.beginPath();
    layerCtx.ellipse(half, half, radius, radius * .64, 0, 0, Math.PI * 2);
    layerCtx.stroke();

    let points = state.asteroidPointCache.get(asteroidCount);
    if (!points) {
      points = Array.from({ length: asteroidCount }, (_, i) => {
        const p = pseudoPoint(i + 2200);
        return { angle: p.x * Math.PI * 2 + (i % 7) * .006, jitter: (p.y - .5) * 58, size: 1 + p.z * 2.6, alpha: .18 + p.z * .36 };
      });
      state.asteroidPointCache.set(asteroidCount, points);
    }

    for (const p of points) {
      const jitter = p.jitter * scale;
      const rx = radius + jitter;
      const ry = (radius + jitter) * .64;
      const x = half + Math.cos(p.angle) * rx;
      const y = half + Math.sin(p.angle) * ry;
      layerCtx.fillStyle = `rgba(230,238,245,${p.alpha})`;
      layerCtx.fillRect(x - p.size, y - p.size * .45, p.size * 2, Math.max(1, p.size * .9));
    }

    state.systemOrbitLayerCache = { key, canvas, half };
    return state.systemOrbitLayerCache;
  }

  function drawAsteroidBelt(ctx, center, scale) {
    const belt = bodyById("rantel-cluster");
    if (!belt?.orbitRadius) return;
    const radius = belt.orbitRadius * scale;
    const layer = asteroidBeltLayer(belt, radius, scale);
    ctx.drawImage(layer.canvas, center.x - layer.half, center.y - layer.half);

    if (state.settings.disableNames) {
      state.systemHits.push({ kind: "body", id: belt.id, x: center.x + radius * 1.02, y: center.y - 8, r: Math.max(58, 80 * scale) });
      return;
    }

    const labelX = center.x + radius * 1.02;
    const labelY = center.y - 8;
    const label = (belt.shortName || belt.name).toUpperCase();
    ctx.save();
    ctx.font = `${Math.max(16, 25 * scale)}px Arial Narrow, Bahnschrift, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,.78)";
    ctx.strokeText(label, labelX, labelY);
    ctx.fillStyle = "rgba(244,248,255,.94)";
    ctx.fillText(label, labelX, labelY);
    ctx.font = `${Math.max(10, 12 * scale)}px Arial Narrow, Bahnschrift, sans-serif`;
    ctx.lineWidth = 3;
    ctx.strokeText("OUTER ASTEROID BELT", labelX, labelY + 22);
    ctx.fillStyle = "rgba(109,247,255,.62)";
    ctx.fillText("OUTER ASTEROID BELT", labelX, labelY + 22);
    const textWidth = ctx.measureText(label).width;
    state.systemHits.push({ kind: "body", id: belt.id, x: labelX + textWidth / 2, y: labelY, r: Math.max(58, textWidth / 2 + 18) });
    ctx.restore();
  }

  function orbitalPosition(body, center, scale) {
    const t = state.animationTime * body.orbitSpeed + (body.orbitOffset || 0);
    const rx = body.orbitRadius * scale;
    const ry = body.orbitRadius * scale * 0.64;
    return {
      x: center.x + Math.cos(t) * rx,
      y: center.y + Math.sin(t) * ry
    };
  }

  function satellitePosition(satellite, parentPos, scale) {
    const orbitRadius = satellite.moonOrbitRadius || satellite.satelliteOrbitRadius || satellite.orbitRadius || 56;
    const orbitSpeed = satellite.moonOrbitSpeed || satellite.satelliteOrbitSpeed || satellite.orbitSpeed || 0.00006;
    const orbitOffset = satellite.moonOrbitOffset || satellite.satelliteOrbitOffset || satellite.orbitOffset || 0;
    const t = state.animationTime * orbitSpeed + orbitOffset;
    const rx = orbitRadius * scale;
    const ry = orbitRadius * scale * .62;
    return {
      x: parentPos.x + Math.cos(t) * rx,
      y: parentPos.y + Math.sin(t) * ry
    };
  }

  function drawSatelliteOrbits(ctx, scale) {
    ctx.save();
    ctx.strokeStyle = "rgba(166, 220, 255, .12)";
    ctx.lineWidth = 1;
    for (const satellite of state.data.bodies.filter(b => b.parentBodyId && b.parentBodyId !== "rantel-cluster")) {
      const parent = state.bodyPositions.get(satellite.parentBodyId);
      if (!parent) continue;
      const orbitRadius = satellite.moonOrbitRadius || satellite.satelliteOrbitRadius || satellite.orbitRadius || 56;
      ctx.beginPath();
      ctx.ellipse(parent.x, parent.y, orbitRadius * scale, orbitRadius * scale * .62, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function systemBodySpriteKey(body, r) {
    const radius = Math.max(4, Math.round(r * 2) / 2);
    const textureKey = textureKeyForBody(body) || "none";
    const hasTexture = state.systemTextureCanvases[textureKey] ? 1 : 0;
    return `${body.id}:${radius}:${body.type}:${body.template || ""}:${body.colorA || ""}:${body.colorB || ""}:${textureKey}:${hasTexture}`;
  }

  function buildSystemBodySprite(body, r) {
    const radius = Math.max(4, Math.round(r * 2) / 2);
    const pad = body.type === "star" ? 52 : 18;
    const size = Math.ceil((radius + pad) * 2);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const spriteCtx = canvas.getContext("2d");
    const x = size / 2;
    const y = size / 2;
    const grad = spriteCtx.createRadialGradient(x - radius * .38, y - radius * .42, radius * .12, x, y, radius);
    grad.addColorStop(0, body.colorB || "#ffffff");
    grad.addColorStop(.52, body.colorA || "#999999");
    grad.addColorStop(1, body.type === "star" ? "#07111d" : "rgba(10, 24, 38, .82)");

    spriteCtx.save();
    spriteCtx.shadowColor = body.type === "star" ? "rgba(255,95,22,.95)" : "rgba(84,180,255,.32)";
    spriteCtx.shadowBlur = body.type === "star" ? 42 : 12;
    spriteCtx.fillStyle = grad;
    spriteCtx.beginPath();
    spriteCtx.arc(x, y, radius, 0, Math.PI * 2);
    spriteCtx.fill();
    spriteCtx.shadowBlur = 0;

    spriteCtx.save();
    spriteCtx.beginPath();
    spriteCtx.arc(x, y, radius, 0, Math.PI * 2);
    spriteCtx.clip();
    drawBodyTexture(spriteCtx, body, x, y, radius);
    spriteCtx.restore();

    spriteCtx.strokeStyle = "rgba(255,255,255,.18)";
    spriteCtx.lineWidth = 1;
    spriteCtx.beginPath();
    spriteCtx.arc(x, y, radius, 0, Math.PI * 2);
    spriteCtx.stroke();
    spriteCtx.restore();
    return { canvas, pad, radius };
  }

  function drawBody(ctx, body, x, y, r, scale) {
    if (body.type === "station") return drawStation(ctx, body, x, y, r);
    const key = systemBodySpriteKey(body, r);
    let sprite = state.systemBodySpriteCache.get(key);
    if (!sprite) {
      sprite = buildSystemBodySprite(body, r);
      if (state.systemBodySpriteCache.size > 180) state.systemBodySpriteCache.clear();
      state.systemBodySpriteCache.set(key, sprite);
    }
    ctx.drawImage(sprite.canvas, x - sprite.canvas.width / 2, y - sprite.canvas.height / 2);
    if (body.id === state.selectedBodyId) {
      ctx.save();
      ctx.strokeStyle = "rgba(109,247,255,.95)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function systemTextureForBody(body) {
    const key = textureKeyForBody(body);
    if (!key) return null;
    return state.systemTextureCanvases[key] || null;
  }

  function makeSystemTexture(key, img) {
    if (!key || !img) return;
    const srcW = img.naturalWidth || img.width || 0;
    const srcH = img.naturalHeight || img.height || 0;
    if (!srcW || !srcH) return;

    // System View should stay readable and stylized, not become a tiny detailed globe.
    // We intentionally crush the theater texture down into a soft "planet signature" thumbnail.
    const sampleW = 96;
    const sampleH = 48;
    const c = document.createElement("canvas");
    c.width = sampleW;
    c.height = sampleH;
    const cctx = c.getContext("2d");
    cctx.imageSmoothingEnabled = true;
    cctx.imageSmoothingQuality = "high";
    cctx.filter = "blur(1.4px) saturate(1.18) contrast(.92)";
    cctx.drawImage(img, 0, 0, sampleW, sampleH);
    cctx.filter = "none";

    // Gentle horizontal blending so the icon feels like a compact model, not a pasted map.
    cctx.globalCompositeOperation = "source-over";
    const veil = cctx.createLinearGradient(0, 0, sampleW, sampleH);
    veil.addColorStop(0, "rgba(255,255,255,.05)");
    veil.addColorStop(.55, "rgba(255,255,255,0)");
    veil.addColorStop(1, "rgba(0,0,0,.18)");
    cctx.fillStyle = veil;
    cctx.fillRect(0, 0, sampleW, sampleH);

    state.systemTextureCanvases[key] = c;
    state.systemBodySpriteCache.clear();
    state.systemDirty = true;
  }

  function makeGlobeRenderTexture(key, img) {
    if (!key || !img) return;
    const srcW = img.naturalWidth || img.width || 0;
    const srcH = img.naturalHeight || img.height || 0;
    if (!srcW || !srcH) return;
    const maxW = 2048;
    const w = Math.min(maxW, srcW);
    const h = Math.max(1, Math.round(w / 2));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cctx = c.getContext("2d");
    cctx.imageSmoothingEnabled = true;
    cctx.imageSmoothingQuality = "high";
    cctx.drawImage(img, 0, 0, w, h);
    state.textureCanvases[key] = c;
  }

  function drawSystemTextureSignature(ctx, body, x, y, r) {
    if (body.type === "star") return false;
    const texture = systemTextureForBody(body);
    if (!texture) return false;
    ctx.save();
    ctx.globalAlpha = body.textureUrl || body.textureDataUrl || body.template === "custom" ? .56 : .32;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(texture, x - r * 1.04, y - r * 1.04, r * 2.08, r * 2.08);
    ctx.restore();
    return true;
  }

  function drawBodyTexture(ctx, body, x, y, r) {
    const hadSignature = drawSystemTextureSignature(ctx, body, x, y, r);

    ctx.globalAlpha = body.type === "star" ? .42 : (hadSignature ? .42 : .28);
    if (body.template === "gas-giant") {
      for (let i = -4; i < 5; i++) {
        ctx.fillStyle = i % 2 ? "rgba(255,255,255,.20)" : "rgba(6, 58, 72, .24)";
        ctx.beginPath();
        ctx.ellipse(x, y + i * r * .18, r * 1.05, r * .085, .08, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    if (body.template === "desert") {
      ctx.strokeStyle = "rgba(90, 38, 18, .32)";
      for (let i = 0; i < 7; i++) {
        const yy = y - r * .6 + i * r * .2;
        ctx.beginPath();
        ctx.bezierCurveTo(x - r, yy, x - r * .35, yy + r * .12, x + r, yy - r * .06);
        ctx.stroke();
      }
      return;
    }
    if (body.template === "jungle") {
      ctx.fillStyle = "rgba(24, 95, 71, .34)";
      for (let i = 0; i < 13; i++) {
        const p = pseudoPoint(i + 300);
        ctx.beginPath();
        ctx.ellipse(x + (p.x - .5) * r * 1.4, y + (p.y - .5) * r * 1.4, r * (.08 + p.z * .16), r * (.04 + p.z * .12), p.z * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    if (body.template === "urban" || body.template === "custom") {
      // Custom moon maps keep a recognizable palette from their theater texture,
      // but the system model stays simplified and icon-like.
      ctx.strokeStyle = "rgba(212,236,255,.26)";
      ctx.lineWidth = Math.max(.75, r * .025);
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - r * .86, y + i * r * .22);
        ctx.bezierCurveTo(x - r * .28, y + i * r * .18, x + r * .25, y + i * r * .3, x + r * .84, y + i * r * .12);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,.13)";
      for (let i = 0; i < 7; i++) {
        const p = pseudoPoint(i + (body.id?.length || 0) * 17);
        ctx.beginPath();
        ctx.arc(x + (p.x - .5) * r * 1.25, y + (p.y - .5) * r * 1.25, r * (.035 + p.z * .045), 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    if (body.template === "ice" || body.template === "barren" || body.template === "oceanic" || body.template === "lush") {
      ctx.strokeStyle = "rgba(255,255,255,.34)";
      for (let i = 0; i < 5; i++) {
        const p = pseudoPoint(i + 700);
        ctx.beginPath();
        ctx.arc(x + (p.x - .5) * r, y + (p.y - .5) * r, r * (.12 + p.z * .2), 0, Math.PI * 2);
        ctx.stroke();
      }
      if (body.template === "oceanic" || body.template === "lush") {
        ctx.fillStyle = "rgba(120, 228, 205, .20)";
        for (let i = 0; i < 6; i++) {
          const p = pseudoPoint(i + 930);
          ctx.beginPath();
          ctx.ellipse(x + (p.x - .5) * r * 1.2, y + (p.y - .5) * r * 1.2, r * (.08 + p.z * .1), r * (.035 + p.z * .06), p.z * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }
    if (body.type === "star") {
      ctx.strokeStyle = "rgba(255,255,118,.8)";
      for (let i = 0; i < 9; i++) {
        const yy = y - r * .8 + i * r * .2;
        ctx.beginPath();
        ctx.bezierCurveTo(x - r, yy, x - r * .3, yy - r * .15, x + r, yy + r * .12);
        ctx.stroke();
      }
    }
  }

  function drawStation(ctx, body, x, y, r) {
    const control = calculateBodyControl(body.id, currentIntelIsActual());
    const dominant = dominantFaction(control.scores);
    const factionColor = dominant ? factionById(dominant.id).color : null;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((state.animationTime * 0.00008 + (body.orbitOffset || 0)) % (Math.PI * 2));
    ctx.shadowColor = factionColor || "rgba(174, 222, 255, .45)";
    ctx.shadowBlur = body.id === state.selectedBodyId ? 18 : 8;
    ctx.strokeStyle = body.id === state.selectedBodyId ? "rgba(109,247,255,.95)" : (factionColor || "rgba(225, 239, 255, .64)");
    ctx.globalAlpha = factionColor ? .72 : 1;
    ctx.fillStyle = factionColor || "rgba(180, 200, 220, .30)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.rect(-r * .65, -r * .65, r * 1.3, r * 1.3);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * 1.2, 0); ctx.lineTo(r * 1.2, 0);
    ctx.moveTo(0, -r * 1.2); ctx.lineTo(0, r * 1.2);
    ctx.moveTo(-r * .9, -r * .9); ctx.lineTo(r * .9, r * .9);
    ctx.moveTo(r * .9, -r * .9); ctx.lineTo(-r * .9, r * .9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * .34, 0, Math.PI * 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = factionColor || "rgba(231, 242, 255, .68)";
    ctx.fill();
    ctx.restore();
  }

  function drawSystemLabel(ctx, body, x, y, r) {
    if (state.settings.disableNames) return;
    if (state.settings.disableSatelliteNames && body.parentBodyId && body.parentBodyId !== "rantel-cluster") return;
    const control = calculateBodyControl(body.id, currentIntelIsActual());
    const dominant = dominantFaction(control.scores);
    const color = dominant ? factionById(dominant.id).color : "#cfe5ff";

    ctx.save();
    ctx.font = `${Math.max(11, Math.min(22, r * .62))}px Arial Narrow, Bahnschrift, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(244,248,255,.94)";
    const label = body.shortName || body.name;
    const labelText = label.toUpperCase();
    const dy = body.type === "moon" ? r + 6 : r + 12;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,.82)";
    ctx.strokeText(labelText, x, y + dy);
    ctx.fillText(labelText, x, y + dy);
    if (state.showIntelOverlay) {
      ctx.fillStyle = color;
      ctx.font = `${Math.max(9, Math.min(13, r * .42))}px Arial Narrow, Bahnschrift, sans-serif`;
      const intelText = control.total ? `${dominant ? factionById(dominant.id).code : "UNK"} ${formatPercent((dominant?.value || 0) / control.total * 100)}` : "NO DATA";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,.78)";
      ctx.strokeText(intelText, x, y + dy + 18);
      ctx.fillText(intelText, x, y + dy + 18);
    }
    ctx.restore();
  }

  function drawSelectedBodyHalo(ctx, center, scale) {
    const selected = bodyById(state.selectedBodyId);
    if (selected?.type === "asteroid_belt" && selected.orbitRadius) {
      const radius = selected.orbitRadius * scale;
      ctx.save();
      ctx.strokeStyle = "rgba(109, 247, 255, .45)";
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 9]);
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, radius, radius * .64, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    const pos = state.bodyPositions.get(state.selectedBodyId);
    if (!pos) return;
    ctx.save();
    ctx.strokeStyle = "rgba(109, 247, 255, .45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 9]);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, Math.max(20, pos.r + 14), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawSystemAnnotations(ctx, width, height) {
    ctx.save();
    ctx.font = `15px Arial Narrow, Bahnschrift, sans-serif`;
    ctx.fillStyle = "rgba(109, 247, 255, .72)";
    ctx.textAlign = "left";
    ctx.fillText("ORBITAL COMMAND HOLOTABLE", 24, 34);
    ctx.fillStyle = "rgba(160, 188, 210, .65)";
    ctx.font = `12px Arial Narrow, Bahnschrift, sans-serif`;
    ctx.fillText("Click planets, moons, stations, or the Rantel Cluster to inspect strategic briefings.", 24, 55);
    ctx.textAlign = "right";
    ctx.fillText("OSIRIS SYSTEM / LIVE WAR EFFORT MODEL", width - 24, height - 24);
    ctx.restore();
  }

  function pseudoPoint(i) {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    const y = Math.sin(i * 269.5 + 93.4) * 12874.2319;
    const z = Math.sin(i * 61.2 + 171.8) * 29834.9021;
    return { x: frac(x), y: frac(y), z: frac(z) };
  }

  function frac(value) {
    return value - Math.floor(value);
  }

  function getCanvasPoint(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function getCanvasWorldPoint(event, canvas, camera) {
    const rect = canvas.getBoundingClientRect();
    return screenToWorldPoint(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      camera,
      rect.width,
      rect.height
    );
  }

  function applyCamera(ctx, camera, width, height) {
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(camera.x, camera.y);
    ctx.translate(-width / 2, -height / 2);
  }

  function screenToWorldPoint(point, camera, width, height) {
    return {
      x: (point.x - width / 2) / camera.zoom + width / 2 - camera.x,
      y: (point.y - height / 2) / camera.zoom + height / 2 - camera.y
    };
  }

  function zoomCameraAt(camera, point, width, height, deltaY, view = "system") {
    const before = screenToWorldPoint(point, camera, width, height);
    const factor = deltaY < 0 ? 1.12 : 0.88;
    const maxZoom = view === "planet" ? 16 : 5.5;
    const minZoom = view === "planet" ? 0.55 : 0.38;
    camera.zoom = clamp(camera.zoom * factor, minZoom, maxZoom);
    camera.x = (point.x - width / 2) / camera.zoom + width / 2 - before.x;
    camera.y = (point.y - height / 2) / camera.zoom + height / 2 - before.y;
  }

  function resetCameras() {
    state.systemCamera = { x: 0, y: 0, zoom: 1 };
    resetPlanetCamera();
  }

  function resetPlanetCamera() {
    state.planetCamera = { x: 0, y: 0, zoom: 1.05 };
  }

  function zoomPlanetFromCenter(deltaSign) {
    const rect = els.planetCanvas.getBoundingClientRect();
    zoomCameraAt(state.planetCamera, { x: rect.width / 2, y: rect.height / 2 }, rect.width, rect.height, deltaSign < 0 ? -100 : 100, "planet");
    constrainCamera("planet");
    state.planetDirty = true;
    renderPlanet();
  }

  function constrainCamera(view) {
    const camera = cameraForView(view);
    const limit = view === "planet" ? 2800 : 1400;
    camera.x = clamp(camera.x, -limit, limit);
    camera.y = clamp(camera.y, -limit, limit);
  }

  function cameraForView(view) {
    return view === "system" ? state.systemCamera : state.planetCamera;
  }

  function canvasForView(view) {
    return view === "system" ? els.systemCanvas : els.planetCanvas;
  }

  function bindCameraControls(canvas, view) {
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      zoomCameraAt(cameraForView(view), getCanvasPoint(event, canvas), rect.width, rect.height, event.deltaY, view);
      constrainCamera(view);
      els.hoverCard.classList.add("hidden");
      if (view === "planet") state.planetDirty = true;
      if (view === "system") state.systemDirty = true;
    }, { passive: false });

    canvas.addEventListener("pointerdown", (event) => {
      if (view === "planet" && event.button === 1 && state.role === "command") {
        event.preventDefault();
        onPlanetMiddleMouse(event);
        return;
      }
      let mode = "pan";
      if (view === "planet" && state.planetViewMode === "globe" && event.button === 0 && !event.shiftKey && !state.placementMode) {
        mode = "rotate";
      } else {
        const leftDragPans = event.button === 0 && (view !== "planet" || event.shiftKey) && !(view === "planet" && state.placementMode);
        const shouldPan = leftDragPans || event.button === 1 || event.button === 2;
        if (!shouldPan) return;
      }
      event.preventDefault();
      canvas.setPointerCapture?.(event.pointerId);
      state.dragCamera = {
        view,
        mode,
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false
      };
      els.hoverCard.classList.add("hidden");
    });

    canvas.addEventListener("pointermove", (event) => {
      const drag = state.dragCamera;
      if (!drag || drag.view !== view || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.lastX;
      const dy = event.clientY - drag.lastY;
      if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
      if (drag.mode === "rotate" && view === "planet") {
        state.planetRotation.lon += dx * 0.0085;
        state.planetRotation.lat = clamp(state.planetRotation.lat + dy * 0.0065, -1.25, 1.25);
        state.planetDirty = true;
      } else {
        const camera = cameraForView(view);
        camera.x += dx / camera.zoom;
        camera.y += dy / camera.zoom;
        constrainCamera(view);
        if (view === "planet") state.planetDirty = true;
        if (view === "system") state.systemDirty = true;
      }
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
    });

    const finishDrag = (event) => {
      const drag = state.dragCamera;
      if (!drag || drag.view !== view || drag.pointerId !== event.pointerId) return;
      if (drag.moved) {
        if (view === "system") state.suppressSystemClick = true;
        if (view === "planet") state.suppressPlanetClick = true;
      }
      state.dragCamera = null;
      canvas.releasePointerCapture?.(event.pointerId);
      if (view === "planet") state.planetDirty = true;
      if (view === "system") state.systemDirty = true;
    };

    canvas.addEventListener("pointerup", finishDrag);
    canvas.addEventListener("pointercancel", finishDrag);
    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  function hitTest(hits, point) {
    for (let i = hits.length - 1; i >= 0; i--) {
      const hit = hits[i];
      const dx = point.x - hit.x;
      const dy = point.y - hit.y;
      if (Math.hypot(dx, dy) <= hit.r) return hit;
    }
    return null;
  }

  function clearHover() {
    state.pendingHover = null;
    state.hoverKey = "";
    state.hoverSize = { width: 0, height: 0 };
    els.hoverCard.classList.add("hidden");
  }

  function scheduleHover(view, event) {
    if (state.dragCamera?.view === view) return;
    state.pendingHover = { view, clientX: event.clientX, clientY: event.clientY };
    if (state.hoverFrame) return;
    state.hoverFrame = requestAnimationFrame(() => {
      state.hoverFrame = 0;
      const pending = state.pendingHover;
      state.pendingHover = null;
      if (!pending || state.dragCamera?.view === pending.view) return;
      if (pending.view === "system") onSystemMouseMove(pending);
      else onPlanetMouseMove(pending);
    });
  }

  function onSystemMouseMove(event) {
    if (state.dragCamera?.view === "system") return;
    const point = getCanvasWorldPoint(event, els.systemCanvas, state.systemCamera);
    const hit = hitTest(state.systemHits, point);
    if (!hit) {
      clearHover();
      return;
    }
    const body = bodyById(hit.id);
    if (!body) return;
    showHover(event.clientX, event.clientY, bodyHoverHtml(body), `body:${body.id}`);
  }

  function onSystemClick(event) {
    if (state.suppressSystemClick) {
      state.suppressSystemClick = false;
      return;
    }
    const hit = hitTest(state.systemHits, getCanvasWorldPoint(event, els.systemCanvas, state.systemCamera));
    if (!hit) return;
    const body = bodyById(hit.id);
    if (!body) return;
    state.selectedBodyId = body.id;
    state.selectedPoiId = null;
    state.selectedTerrainId = null;
    renderAllPanels();
  }

  function bodyHoverHtml(body) {
    const control = calculateBodyControl(body.id, currentIntelIsActual());
    const dominant = dominantFaction(control.scores);
    const domFaction = dominant ? factionById(dominant.id) : null;
    const count = poisForBody(body.id, { visibleOnly: true }).length;
    return `
      <h3>${escapeHtml(body.name)}</h3>
      <p>${escapeHtml(body.statusLabel || titleCase(body.type))}</p>
      <p>${domFaction ? `${escapeHtml(domFaction.name)} influence: ${formatPercent((dominant.value / Math.max(1, control.total)) * 100)}` : "No control data yet."}</p>
      <p>${count} visible strategic point${count === 1 ? "" : "s"}.</p>
    `;
  }

  function showHover(clientX, clientY, html, key = "") {
    const contentChanged = state.hoverKey !== key;
    if (contentChanged) {
      state.hoverKey = key;
      els.hoverCard.innerHTML = html;
      state.hoverSize = { width: 0, height: 0 };
    }
    els.hoverCard.classList.remove("hidden");
    if (!state.hoverSize.width || !state.hoverSize.height) {
      const rect = els.hoverCard.getBoundingClientRect();
      state.hoverSize = { width: rect.width, height: rect.height };
    }
    let left = clientX + 16;
    let top = clientY + 16;
    if (left + state.hoverSize.width > window.innerWidth - 12) left = clientX - state.hoverSize.width - 16;
    if (top + state.hoverSize.height > window.innerHeight - 12) top = clientY - state.hoverSize.height - 16;
    els.hoverCard.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
  }

  function renderPlanet() {
    const { width, height } = resizeCanvas(els.planetCanvas, planetCtx);
    const ctx = planetCtx;
    let body = bodyById(state.selectedBodyId);
    if (!bodyHasTheater(body)) {
      body = firstTheaterBody();
      if (body) state.selectedBodyId = body.id;
    }
    if (!body) return;
    ensureTextureForBody(body);

    els.planetTitle.textContent = body.name;
    els.planetSelect.value = body.id;

    clearCanvas(ctx, els.planetCanvas, width, height);
    drawPlanetBackground(ctx, width, height, body);
    state.planetHits = [];

    ctx.save();
    try {
      applyCamera(ctx, state.planetCamera, width, height);
      if (state.planetViewMode === "flat") {
        const mapRect = flatMapBounds(width, height);
        drawFlatMapSurface(ctx, mapRect, body);
        if (state.showPOIs) drawPoisOnFlatMap(ctx, mapRect, body.id);
      } else {
        const globe = globeBounds(width, height, body);
        drawGlobe(ctx, globe, body);
        if (state.showTerrain) drawTerrainOnGlobe(ctx, globe, body.id);
        if (body.type === "planet") drawLocalSatellites(ctx, globe, body);
        if (state.showPOIs) drawPoisOnGlobe(ctx, globe, body.id);
      }
    } finally {
      ctx.restore();
    }

    state.planetDirty = false;
  }

  function clearCanvas(ctx, canvas, width, height) {
    // Be deliberately heavy-handed here: pan/zoom transforms are useful, ghosts are not.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width || Math.round(width * dpr), canvas.height || Math.round(height * dpr));
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function globeBounds(width, height, body) {
    const base = Math.max(170, Math.min(width, height) * 0.405);
    const r = (body?.template === "gas-giant" ? base * 1.03 : base);
    return { cx: width * 0.47, cy: height * 0.55, r };
  }


function flatMapBounds(width, height) {
  const padX = 28;
  const topPad = 56;
  const bottomPad = 26;
  const availW = Math.max(200, width - padX * 2);
  const availH = Math.max(100, height - topPad - bottomPad);
  let w = availW;
  let h = w / 2;
  if (h > availH) {
    h = availH;
    w = h * 2;
  }
  return {
    x: (width - w) / 2,
    y: topPad + (availH - h) / 2,
    w,
    h
  };
}

function screenPointToFlatMapCoords(point, rect) {
  if (!rect) return null;
  if (point.x < rect.x || point.x > rect.x + rect.w || point.y < rect.y || point.y > rect.y + rect.h) return null;
  return {
    x: clamp((point.x - rect.x) / rect.w, 0, 1),
    y: clamp((point.y - rect.y) / rect.h, 0, 1)
  };
}

function drawFlatMapSurface(ctx, rect, body) {
  const texKey = textureKeyForBody(body);
  const img = state.textures[texKey];
  const renderSource = state.textureCanvases[texKey] || img;
  ctx.save();
  ctx.fillStyle = "rgba(3, 12, 22, .94)";
  ctx.strokeStyle = "rgba(122, 202, 255, .46)";
  ctx.lineWidth = 2;
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 18);
  ctx.fill();
  ctx.stroke();
  ctx.clip();
  if (img?.complete && renderSource) {
    ctx.drawImage(renderSource, rect.x, rect.y, rect.w, rect.h);
  } else {
    const palette = fallbackSurfacePalette(body);
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    grad.addColorStop(0, palette.mid);
    grad.addColorStop(1, palette.dark);
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.fillStyle = "rgba(255,255,255,.05)";
  for (let i = 0; i < 8; i++) ctx.fillRect(rect.x, rect.y + i * rect.h / 8, rect.w, 1);
  ctx.strokeStyle = "rgba(228, 243, 255, .24)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 12; i++) {
    const x = rect.x + (i / 12) * rect.w;
    ctx.beginPath(); ctx.moveTo(x, rect.y); ctx.lineTo(x, rect.y + rect.h); ctx.stroke();
  }
  for (let i = 0; i <= 6; i++) {
    const y = rect.y + (i / 6) * rect.h;
    ctx.beginPath(); ctx.moveTo(rect.x, y); ctx.lineTo(rect.x + rect.w, y); ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.font = "12px Arial Narrow, Bahnschrift, sans-serif";
  ctx.fillStyle = "rgba(181, 214, 236, .82)";
  ctx.fillText("2:1 EQUIRECTANGULAR MASTER MAP · USE THIS VIEW FOR PRECISE POI EDITING", rect.x + 14, rect.y + 18);
  ctx.textAlign = "right";
  ctx.fillText("0° / 360° seam wraps at left-right edges", rect.x + rect.w - 14, rect.y + rect.h - 12);
  ctx.restore();
}

function flatMapDetailLevel() {
  const z = state.planetCamera.zoom;
  if (z >= 2.6) return 3;
  if (z >= 1.35) return 2;
  return 1;
}


function poiTierRank(poi) {
  const tierId = poi.strategicTier || tierFromValue(Number(poi.strategicValue || 0));
  return { none: 0, minor: 1, standard: 2, major: 3, critical: 4, decisive: 5 }[tierId] ?? 1;
}

function passesPoiRenderDistance(poi) {
  const zoom = state.planetCamera.zoom || 1;
  const rank = poiTierRank(poi);
  if (zoom < 1.28) return rank >= 3;       // Fit/orbital view: Major and above.
  if (zoom < 1.75) return rank >= 2;       // About two zoom-ins: Standard and above.
  return true;                             // About five zoom-ins: all tiers.
}

function poiTypeFilterEnabled(poi) {
  state.settings.poiTypeFilters ??= {};
  const typeId = normalizePoiTypeId(poi.type);
  return state.settings.poiTypeFilters[typeId] !== false;
}

function shouldRenderPoiOnMap(poi) {
  if (!poiTypeFilterEnabled(poi)) return false;
  if (state.settings.disablePoiRendering) return true;
  return passesPoiRenderDistance(poi);
}

function defaultPoiDisplaySize(typeId, tierId, iconId = "") {
  const type = normalizePoiTypeId(typeId || "tactical");
  const tier = tierId || "minor";
  if (type === "settlement") {
    if ((iconId || "").endsWith("capital")) return 1.32;
    if ((iconId || "").endsWith("city")) return 1.18;
    if ((iconId || "").endsWith("town")) return 1.02;
    return 0.9;
  }
  if (type === "military") {
    if ((iconId || "").endsWith("command")) return 1.24;
    if ((iconId || "").endsWith("fortress")) return 1.12;
    if ((iconId || "").endsWith("base")) return 1.04;
    return 0.94;
  }
  if (type === "outpost") return 0.9;
  if (type === "resource") return tier === "major" ? 0.98 : tier === "standard" ? 0.84 : 0.72;
  if (type === "production") return tier === "major" ? 0.98 : tier === "standard" ? 0.86 : 0.74;
  if (type === "hazard") return 0.92;
  if (type === "exploration") return 0.9;
  if (type === "tactical") return tier === "major" ? 1.02 : tier === "standard" ? 0.9 : 0.8;
  return 1;
}

function poiDisplaySizeValue(poi) {
  return clamp(Number(poi.displaySize || defaultPoiDisplaySize(poi.type, poi.strategicTier, poi.modelTemplateId)), 0.25, 3);
}

function poiTextSizeValue(poi) {
  return clamp(Number(poi.textSize ?? 1), 0.5, 3);
}

function drawPoisOnFlatMap(ctx, rect, bodyId) {
  const pois = poisForBody(bodyId, { visibleOnly: true }).filter(shouldRenderPoiOnMap);
  const lod = flatMapDetailLevel();
  const perspective = clamp(0.82 + state.planetCamera.zoom * 0.16, 0.88, 1.45);
  for (const poi of pois) {
    const projected = { x: rect.x + poi.x * rect.w, y: rect.y + poi.y * rect.h };
    drawPoiModel(ctx, projected, poi, perspective, lod);
    const r = 18 * perspective;
    state.planetHits.push({ kind: "poi", id: poi.id, x: projected.x, y: projected.y, r: r + 10, z: 1 });
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

  function drawPlanetBackground(ctx, width, height, body) {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    let cache = state.planetBackgroundCache;
    if (!cache || cache.width !== w || cache.height !== h) {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const bgCtx = canvas.getContext("2d", { alpha: false });
      const grad = bgCtx.createRadialGradient(w * .42, h * .24, 10, w * .55, h * .62, Math.max(w, h));
      grad.addColorStop(0, "rgba(36, 108, 171, .14)");
      grad.addColorStop(.5, "rgba(2, 8, 17, .88)");
      grad.addColorStop(1, "rgba(0, 2, 7, 1)");
      bgCtx.fillStyle = grad;
      bgCtx.fillRect(0, 0, w, h);

      const count = Math.floor((w * h) / 7000);
      for (let i = 0; i < count; i++) {
        const p = pseudoPoint(i + 6400);
        const alpha = .18 + p.z * .42;
        bgCtx.fillStyle = `rgba(235,248,255,${alpha})`;
        bgCtx.fillRect(p.x * w, p.y * h, p.z > .94 ? 2 : 1, p.z > .94 ? 2 : 1);
      }

      bgCtx.save();
      bgCtx.globalAlpha = .06;
      bgCtx.strokeStyle = "#dbefff";
      for (let i = 0; i < 12; i++) {
        const y = (h / 12) * i;
        bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(w, y); bgCtx.stroke();
      }
      for (let i = 0; i < 18; i++) {
        const x = (w / 18) * i;
        bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, h); bgCtx.stroke();
      }
      bgCtx.restore();
      cache = state.planetBackgroundCache = canvas;
    }
    ctx.drawImage(cache, 0, 0, width, height);

    ctx.save();
    ctx.font = "13px Arial Narrow, Bahnschrift, sans-serif";
    ctx.fillStyle = "rgba(109, 247, 255, .56)";
    const modeLabel = state.planetViewMode === "flat" ? "FLAT TACTICAL MAP" : "SATELLITE GLOBE THEATER";
    ctx.fillText(`${body.name.toUpperCase()} / ${modeLabel}`, 20, 24);
    const zoom = state.planetCamera.zoom;
    const lod = zoom >= 5 ? "TACTICAL DETAIL LOD" : zoom >= 2.1 ? "REGIONAL DETAIL LOD" : "ORBITAL DETAIL LOD";
    ctx.fillStyle = "rgba(160, 188, 210, .62)";
    ctx.fillText(`${state.planetViewMode === "flat" ? "DRAG MAP TO PAN" : "DRAG GLOBE TO ROTATE"} · WHEEL TO ZOOM · ${state.planetViewMode === "flat" ? "CLICK/RIGHT-CLICK POI" : "SHIFT/RIGHT-DRAG TO PAN"} · ${lod}`, 20, 44);
    ctx.restore();
  }

  function drawGlobe(ctx, globe, body) {
    const { cx, cy, r } = globe;
    ctx.save();
    ctx.shadowColor = body.template === "gas-giant" ? "rgba(82, 227, 227, .34)" : "rgba(84,180,255,.30)";
    ctx.shadowBlur = 34;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(14, 30, 50, .88)";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    renderTexturedSphere(ctx, globe, body);

    const atmosphere = ctx.createRadialGradient(cx - r * .35, cy - r * .4, r * .05, cx, cy, r * 1.08);
    atmosphere.addColorStop(0, "rgba(255,255,255,.18)");
    atmosphere.addColorStop(.45, "rgba(255,255,255,0)");
    atmosphere.addColorStop(.82, body.template === "gas-giant" ? "rgba(105,255,240,.10)" : "rgba(109,247,255,.08)");
    atmosphere.addColorStop(1, "rgba(0,0,0,.48)");
    ctx.fillStyle = atmosphere;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    if (state.planetCamera.zoom < 1.5) drawGlobeGrid(ctx, globe, body);

    ctx.strokeStyle = body.id === state.selectedBodyId ? "rgba(109,247,255,.96)" : "rgba(208,235,255,.40)";
    ctx.lineWidth = body.id === state.selectedBodyId ? 2 : 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(109,247,255,.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  function textureKeyForBody(body) {
    if (body?.textureUrl || body?.textureDataUrl) return body.id;
    const direct = {
      "osiris-prime": "osiris-prime",
      vau: "vau",
      brekka: "brekka",
      vulkan: "vulkan"
    };
    if (direct[body.id]) return direct[body.id];
    if (["barren", "oceanic", "urban", "lush"].includes(body.template)) return body.template;
    const byTemplate = { ice: "osiris-prime", desert: "vau", jungle: "brekka", lush: "lush", "gas-giant": "vulkan" };
    return byTemplate[body.template] || null;
  }

  const MAX_SHARED_TEXTURE_BYTES = 50 * 1024 * 1024;

  function customTextureSource(body) {
    return body?.textureUrl || body?.textureDataUrl || "";
  }

  function cacheBodyTexture(body, source, { showError = false } = {}) {
    if (!body?.id || !source) return;
    delete state.textures[body.id];
    delete state.textureCanvases[body.id];
    delete state.systemTextureCanvases[body.id];

    const img = new Image();
    let retriedWithoutCors = false;
    if (/^https?:\/\//i.test(source)) img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      state.textures[body.id] = img;
      makeSystemTexture(body.id, img);
      makeGlobeRenderTexture(body.id, img);
      state.planetDirty = true;
      state.systemDirty = true;
      if (state.globeRenderer?.textureKey === body.id) state.globeRenderer.textureKey = "";
      if (els.bodyEditSelect?.value === body.id) renderBodyTextureEditor(body);
    };
    img.onerror = () => {
      if (img.crossOrigin && !retriedWithoutCors) {
        retriedWithoutCors = true;
        img.removeAttribute("crossorigin");
        img.src = source;
        return;
      }
      console.warn(`Could not load the custom texture for ${body.name || body.id}.`, source);
      if (showError) flashMessage(`The texture for ${body.name || body.id} was saved, but the browser could not load its image URL.`);
    };
    img.src = source;
  }

  function inspectTextureFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error("Choose an image file first."));
      if (!/^image\/(png|jpeg|webp)$/i.test(file.type || "")) {
        return reject(new Error("Moon textures must be PNG, JPEG, or WebP images."));
      }
      if (file.size > MAX_SHARED_TEXTURE_BYTES) {
        return reject(new Error("Moon textures must be 50 MB or smaller for the shared Supabase texture bucket."));
      }
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        URL.revokeObjectURL(objectUrl);
        if (!width || !height) return reject(new Error("The selected texture has invalid dimensions."));
        const ratio = width / height;
        if (Math.abs(ratio - 2) > 0.05) {
          return reject(new Error(`Moon textures must use a 2:1 equirectangular layout. This file is ${width}×${height}.`));
        }
        resolve({ width, height });
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("The selected texture could not be read as an image."));
      };
      image.src = objectUrl;
    });
  }

  async function uploadOrEmbedBodyTexture(file, bodyId) {
    await inspectTextureFile(file);
    if (window.CC_LOGISTICS?.uploadAtlasTexture) {
      try {
        const uploaded = await window.CC_LOGISTICS.uploadAtlasTexture(file, bodyId);
        if (uploaded?.url) {
          return { textureUrl: uploaded.url, texturePath: uploaded.path || null, textureDataUrl: null, shared: true };
        }
      } catch (err) {
        console.warn("Shared texture upload failed; keeping a local browser copy.", err);
        flashMessage(`Shared texture upload failed: ${err.message || err}. A local copy will be used until an Admin or Root account publishes it.`);
      }
    }
    return {
      textureUrl: null,
      texturePath: null,
      textureDataUrl: await readFileAsDataUrl(file),
      shared: false
    };
  }

  const BUILTIN_TEXTURE_MANIFEST = {
    "osiris-prime": "assets/textures/osiris-prime_map.png",
    vau: "assets/textures/vau_map.png",
    brekka: "assets/textures/brekka_map.png",
    vulkan: "assets/textures/vulkan_map.png",
    barren: "assets/textures/barren_map.png",
    oceanic: "assets/textures/oceanic_map.png",
    urban: "assets/textures/urban_map.png",
    lush: "assets/textures/lush_map.png"
  };
  const SYSTEM_DISK_MANIFEST = {
    "osiris-prime": "assets/textures/osiris-prime_disk.png",
    vau: "assets/textures/vau_disk.png",
    brekka: "assets/textures/brekka_disk.png",
    vulkan: "assets/textures/vulkan_disk.png"
  };
  const pendingTextureLoads = new Map();

  function loadTextureImage(key, src, { full = true, systemOnly = false, systemDisk = false } = {}) {
    if (!key || !src) return Promise.resolve(null);
    const pendingKey = `${key}:${systemOnly ? "system" : "full"}`;
    if (full && state.textures[key]) return Promise.resolve(state.textures[key]);
    if (pendingTextureLoads.has(pendingKey)) return pendingTextureLoads.get(pendingKey);
    const promise = new Promise(resolve => {
      const img = new Image();
      let retriedWithoutCors = false;
      if (/^https?:\/\//i.test(src)) img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => {
        if (systemOnly) {
          if (systemDisk) {
            const c = document.createElement("canvas");
            c.width = 96; c.height = 96;
            const cctx = c.getContext("2d");
            cctx.imageSmoothingEnabled = true;
            cctx.imageSmoothingQuality = "medium";
            cctx.drawImage(img, 0, 0, 96, 96);
            state.systemTextureCanvases[key] = c;
            state.systemBodySpriteCache.clear();
            state.systemDirty = true;
          } else {
            makeSystemTexture(key, img);
          }
        } else {
          state.textures[key] = img;
          makeSystemTexture(key, img);
          makeGlobeRenderTexture(key, img);
          if (state.globeRenderer?.textureKey === key) state.globeRenderer.textureKey = "";
          state.planetDirty = true;
          state.systemDirty = true;
        }
        pendingTextureLoads.delete(pendingKey);
        resolve(img);
      };
      img.onerror = () => {
        if (img.crossOrigin && !retriedWithoutCors) {
          retriedWithoutCors = true;
          img.removeAttribute("crossorigin");
          img.src = src;
          return;
        }
        pendingTextureLoads.delete(pendingKey);
        resolve(null);
      };
      img.src = src;
    });
    pendingTextureLoads.set(pendingKey, promise);
    return promise;
  }

  function ensureTextureForBody(body) {
    if (!body) return;
    const key = textureKeyForBody(body);
    if (!key || state.textures[key]) return;
    const custom = customTextureSource(body);
    if (custom) {
      cacheBodyTexture(body, custom);
      return;
    }
    const src = BUILTIN_TEXTURE_MANIFEST[key];
    if (src) loadTextureImage(key, src);
  }

  function loadTextures() {
    // Every body receives a lightweight System View texture immediately, including uploaded moon maps.
    // Full-resolution theater textures remain lazy and load only when their body is opened.
    const customBodyIds = new Set(state.data.bodies.filter(body => customTextureSource(body)).map(body => body.id));
    for (const [key, src] of Object.entries(SYSTEM_DISK_MANIFEST)) {
      if (!customBodyIds.has(key)) loadTextureImage(key, src, { full: false, systemOnly: true, systemDisk: true });
    }
    for (const key of ["barren", "oceanic", "urban", "lush"]) {
      loadTextureImage(key, BUILTIN_TEXTURE_MANIFEST[key], { full: false, systemOnly: true });
    }
    for (const body of state.data.bodies) {
      const source = customTextureSource(body);
      if (source) loadTextureImage(body.id, source, { full: false, systemOnly: true });
    }
    if (state.activeView === "planet") ensureTextureForBody(bodyById(state.selectedBodyId));
  }

  function fallbackSurfacePalette(body) {
    const template = body.template || body.type;
    if (template === "desert") return { dark: "#1c1109", mid: "#9b5d27", lightSolid: "#f2c276", light: "rgba(235, 179, 104, .32)", accent: "rgba(84, 193, 185, .40)" };
    if (template === "jungle") return { dark: "#03160e", mid: "#1d6b50", lightSolid: "#87d5cb", light: "rgba(100, 226, 139, .24)", accent: "rgba(210, 247, 255, .38)" };
    if (template === "ice") return { dark: "#111f30", mid: "#8092a8", lightSolid: "#eef7ff", light: "rgba(239, 249, 255, .34)", accent: "rgba(54, 93, 134, .42)" };
    if (template === "gas-giant") return { dark: "#031e24", mid: "#0c7785", lightSolid: "#65ebe4", light: "rgba(134, 255, 248, .26)", accent: "rgba(2, 41, 58, .45)" };
    if (template === "barren") return { dark: "#1a1d25", mid: "#737b87", lightSolid: "#d8dde5", light: "rgba(220, 229, 239, .24)", accent: "rgba(42, 45, 54, .36)" };
    if (template === "oceanic") return { dark: "#021928", mid: "#0c79b5", lightSolid: "#88e2ff", light: "rgba(120, 221, 255, .25)", accent: "rgba(238, 248, 255, .32)" };
    if (template === "urban") return { dark: "#151a25", mid: "#707b90", lightSolid: "#dfe5f0", light: "rgba(234, 241, 255, .20)", accent: "rgba(109,247,255,.24)" };
    if (template === "lush") return { dark: "#082413", mid: "#328150", lightSolid: "#a6e88d", light: "rgba(166, 232, 141, .23)", accent: "rgba(70, 160, 220, .28)" };
    return { dark: "#111827", mid: "#33445e", lightSolid: "#b4d4ff", light: "rgba(180, 210, 255, .22)", accent: "rgba(109,247,255,.25)" };
  }


  function coordinateToLonLat(x, y) {
    return { lon: (Number(x) - .5) * Math.PI * 2, lat: (.5 - Number(y)) * Math.PI };
  }

  function rotateSpherePoint(lon, lat) {
    const clat = Math.cos(lat);
    let x = clat * Math.sin(lon);
    let y = Math.sin(lat);
    let z = clat * Math.cos(lon);

    const cy = Math.cos(state.planetRotation.lon);
    const sy = Math.sin(state.planetRotation.lon);
    const x1 = x * cy + z * sy;
    const z1 = -x * sy + z * cy;

    const cx = Math.cos(state.planetRotation.lat);
    const sx = Math.sin(state.planetRotation.lat);
    const y2 = y * cx - z1 * sx;
    const z2 = y * sx + z1 * cx;
    return { x: x1, y: y2, z: z2 };
  }

  function projectSphere(lon, lat, globe) {
    const pt = rotateSpherePoint(lon, lat);
    return {
      x: globe.cx + pt.x * globe.r,
      y: globe.cy - pt.y * globe.r,
      z: pt.z,
      visible: pt.z > 0
    };
  }

  function drawProjectedBlob(ctx, globe, lon, lat, rx, ry, rotation, color, minVisible = 0) {
    const projected = projectSphere(lon, lat, globe);
    if (!projected.visible || projected.z < minVisible) return;
    const scale = .42 + projected.z * .58;
    ctx.save();
    ctx.translate(projected.x, projected.y);
    ctx.rotate(rotation);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * scale, ry * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSpherePath(ctx, globe, pointFn, color, width, start = -Math.PI / 2, end = Math.PI / 2) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    let open = false;
    for (let i = 0; i <= 96; i++) {
      const t = start + (i / 96) * (end - start);
      const pt = pointFn(t);
      const projected = projectSphere(pt.lon, pt.lat, globe);
      if (!projected.visible) {
        if (open) { ctx.stroke(); open = false; }
        continue;
      }
      if (!open) { ctx.beginPath(); ctx.moveTo(projected.x, projected.y); open = true; }
      else ctx.lineTo(projected.x, projected.y);
    }
    if (open) ctx.stroke();
    ctx.restore();
  }

  function drawLatitudePath(ctx, globe, lat, color, width) {
    drawSpherePath(ctx, globe, (t) => ({ lon: t, lat }), color, width, -Math.PI, Math.PI);
  }

  function screenPointToPlanetCoords(point, globe) {
    const sx = (point.x - globe.cx) / globe.r;
    const sy = -(point.y - globe.cy) / globe.r;
    const d2 = sx * sx + sy * sy;
    if (d2 > 1) return null;
    const sz = Math.sqrt(1 - d2);
    const inv = inverseRotatePoint(sx, sy, sz);
    const lat = Math.asin(clamp(inv.y, -1, 1));
    let lon = Math.atan2(inv.x, inv.z);
    let xCoord = (lon + Math.PI) / (Math.PI * 2);
    xCoord = ((xCoord % 1) + 1) % 1;
    const yCoord = clamp(.5 - lat / Math.PI, 0, 1);
    return { x: xCoord, y: yCoord, lon, lat };
  }

  function drawFallbackSurfaceDetail(ctx, globe, body, palette) {
    // Intentionally minimal: no random ovals, squiggles, or generated terrain marks.
    // Planet detail should come from real texture assets or admin-created POIs.
    ctx.save();
    ctx.globalAlpha = .10;
    const bandCount = (body.template || "") === "gas-giant" ? 8 : 3;
    for (let i = 0; i < bandCount; i++) {
      const y = globe.cy - globe.r * .45 + (i / Math.max(1, bandCount - 1)) * globe.r * .9;
      ctx.strokeStyle = (body.template || "") === "gas-giant" ? palette.accent : "rgba(255,255,255,.18)";
      ctx.lineWidth = (body.template || "") === "gas-giant" ? Math.max(4, globe.r * .018) : 1;
      ctx.beginPath();
      ctx.ellipse(globe.cx, y, globe.r * .82, globe.r * .10, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGlobeGrid(ctx, globe, body) {
    ctx.save();
    ctx.globalAlpha = .55;
    for (let i = -3; i <= 3; i++) drawLatitudePath(ctx, globe, i * .22, "rgba(220, 244, 255, .48)", 1.25);
    for (let i = 0; i < 12; i++) {
      const lon = -Math.PI + i * Math.PI / 6;
      drawSpherePath(ctx, globe, (t) => ({ lon, lat: t }), "rgba(220, 244, 255, .34)", 1.15);
    }
    ctx.restore();
  }

  function compileGlobeShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) || "Unknown shader error";
      gl.deleteShader(shader);
      throw new Error(message);
    }
    return shader;
  }

  function createGlobeRenderer() {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      });
      if (!gl) return null;

      const vertexSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
          v_uv = a_position * 0.5 + 0.5;
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;
      const fragmentSource = `
        precision highp float;
        varying vec2 v_uv;
        uniform sampler2D u_texture;
        uniform vec2 u_rotation;
        const float PI = 3.141592653589793;
        void main() {
          vec2 p = v_uv * 2.0 - 1.0;
          float d2 = dot(p, p);
          if (d2 > 1.0) discard;
          float z = sqrt(max(0.0, 1.0 - d2));
          float cx = cos(-u_rotation.y);
          float sx = sin(-u_rotation.y);
          float y1 = p.y * cx - z * sx;
          float z1 = p.y * sx + z * cx;
          float cy = cos(-u_rotation.x);
          float sy = sin(-u_rotation.x);
          float x0 = p.x * cy + z1 * sy;
          float z0 = -p.x * sy + z1 * cy;
          float lat = asin(clamp(y1, -1.0, 1.0));
          float lon = atan(x0, z0);
          float u = fract((lon + PI) / (2.0 * PI));
          float v = clamp(0.5 + lat / PI, 0.0, 1.0);
          gl_FragColor = texture2D(u_texture, vec2(u, v));
        }
      `;

      const program = gl.createProgram();
      gl.attachShader(program, compileGlobeShader(gl, gl.VERTEX_SHADER, vertexSource));
      gl.attachShader(program, compileGlobeShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "Could not link globe shader.");
      gl.useProgram(program);

      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);

      const renderer = {
        canvas,
        gl,
        program,
        texture,
        rotationLocation: gl.getUniformLocation(program, "u_rotation"),
        textureKey: "",
        failedKeys: new Set(),
        size: 0
      };
      canvas.addEventListener("webglcontextlost", event => {
        event.preventDefault();
        state.globeRenderer = null;
        state.globeRendererUnavailable = false;
        state.planetDirty = true;
      });
      return renderer;
    } catch (err) {
      console.warn("WebGL globe renderer unavailable; using Canvas fallback.", err);
      return null;
    }
  }

  function renderGlobeWithWebGL(ctx, globe, body, img) {
    const key = textureKeyForBody(body);
    if (!key || state.globeRendererUnavailable) return false;
    const renderer = state.globeRenderer || (state.globeRenderer = createGlobeRenderer());
    if (!renderer) {
      state.globeRendererUnavailable = true;
      return false;
    }
    if (renderer.failedKeys.has(key)) return false;
    const gl = renderer.gl;
    const desiredSize = clamp(Math.round(globe.r * 2 * Math.min(window.devicePixelRatio || 1, 1.25)), 256, 1024);
    if (renderer.size !== desiredSize) {
      renderer.canvas.width = desiredSize;
      renderer.canvas.height = desiredSize;
      renderer.size = desiredSize;
      gl.viewport(0, 0, desiredSize, desiredSize);
    }

    if (renderer.textureKey !== key) {
      try {
        const source = state.textureCanvases[key] || img;
        gl.bindTexture(gl.TEXTURE_2D, renderer.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        renderer.textureKey = key;
      } catch (err) {
        renderer.failedKeys.add(key);
        console.warn(`WebGL could not upload the texture for ${body.name || key}; using Canvas fallback.`, err);
        return false;
      }
    }

    gl.useProgram(renderer.program);
    gl.uniform2f(renderer.rotationLocation, state.planetRotation.lon, state.planetRotation.lat);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = state.dragCamera?.view === "planet" ? "medium" : "high";
    ctx.drawImage(renderer.canvas, globe.cx - globe.r, globe.cy - globe.r, globe.r * 2, globe.r * 2);
    ctx.restore();
    return true;
  }

  function renderTexturedSphere(ctx, globe, body) {
    const img = state.textures[textureKeyForBody(body)];
    if (!textureReady(img)) {
      drawProceduralSphereFallback(ctx, globe, body);
      return;
    }

    try {
      // Custom moon textures can arrive from shared uploads and behave inconsistently with the
      // GPU globe path on some browsers/hosts. The Canvas projection remains smooth after the
      // v0.5.0 optimizations and guarantees those uploaded moon textures display correctly.
      const preferCanvasProjection = body?.type === "moon";
      if (preferCanvasProjection || !renderGlobeWithWebGL(ctx, globe, body, img)) {
        drawEquirectangularTextureOnSphere(ctx, globe, body, img);
      }
      drawGlobeSurfaceShade(ctx, globe);
    } catch (err) {
      console.warn("Textured sphere render failed; falling back to procedural globe.", err);
      drawProceduralSphereFallback(ctx, globe, body);
    }
  }

  function drawGlobeSurfaceShade(ctx, globe) {
    const { cx, cy, r } = globe;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    const shade = ctx.createRadialGradient(cx - r * .32, cy - r * .34, r * .08, cx, cy, r);
    shade.addColorStop(0, "rgba(255,255,255,.10)");
    shade.addColorStop(.44, "rgba(255,255,255,0)");
    shade.addColorStop(.78, "rgba(0,0,0,.18)");
    shade.addColorStop(1, "rgba(0,0,0,.56)");
    ctx.fillStyle = shade;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
  }

  function textureReady(img) {
    return Boolean(img && img.complete && (img.naturalWidth || img.width) && (img.naturalHeight || img.height));
  }

  function drawEquirectangularTextureOnSphere(ctx, globe, body, img) {
    const { cx, cy, r } = globe;
    const key = textureKeyForBody(body);
    const source = state.textureCanvases[key] || img;
    const iw = source.width || source.naturalWidth || img.naturalWidth || img.width;
    const ih = source.height || source.naturalHeight || img.naturalHeight || img.height;
    const zoom = state.planetCamera.zoom || 1;
    const dragging = state.dragCamera?.view === "planet";

    // Adaptive sampling keeps the 8K source responsive while preserving the satellite-globe look.
    // The render texture is already downscaled to the visible needs of the canvas, so the globe does not
    // spend time drawing invisible 8K detail.
    const step = dragging ? 8 : (zoom >= 3.6 ? 2 : 3);
    const sampleW = Math.max(1, Math.ceil(step * iw / Math.max(1, r * Math.PI * 2)));
    const sampleH = Math.max(1, Math.ceil(step * ih / Math.max(1, r * Math.PI)));

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Browser-safe sphere projection: draw directly from the 2:1 flat map render texture.
    for (let dy = -r; dy <= r; dy += step) {
      const yn = -dy / r;
      const rowLimit = Math.sqrt(Math.max(0, 1 - yn * yn));
      const yEnd = Math.min(r, dy + step);
      for (let dx = -rowLimit * r; dx <= rowLimit * r; dx += step) {
        const xn = dx / r;
        const d2 = xn * xn + yn * yn;
        if (d2 > 1) continue;
        const zn = Math.sqrt(Math.max(0, 1 - d2));
        const inv = inverseRotatePoint(xn, yn, zn);
        const lat = Math.asin(clamp(inv.y, -1, 1));
        let lon = Math.atan2(inv.x, inv.z);
        let u = (lon + Math.PI) / (Math.PI * 2);
        u = ((u % 1) + 1) % 1;
        const v = clamp(.5 - lat / Math.PI, 0, 1);
        const sx = clamp(Math.floor(u * (iw - 1)), 0, iw - 1);
        const sy = clamp(Math.floor(v * (ih - 1)), 0, ih - 1);
        ctx.drawImage(source, sx, sy, sampleW, sampleH, cx + dx, cy + dy, step + 1, Math.max(1, yEnd - dy + 1));
      }
    }

    ctx.restore();
  }

  function drawProceduralSphereFallback(ctx, globe, body) {
    const palette = fallbackSurfacePalette(body);
    ctx.save();
    ctx.beginPath();
    ctx.arc(globe.cx, globe.cy, globe.r, 0, Math.PI * 2);
    ctx.clip();
    const base = ctx.createRadialGradient(globe.cx - globe.r * .34, globe.cy - globe.r * .38, globe.r * .05, globe.cx, globe.cy, globe.r);
    base.addColorStop(0, palette.lightSolid);
    base.addColorStop(.44, palette.mid);
    base.addColorStop(1, palette.dark);
    ctx.fillStyle = base;
    ctx.fillRect(globe.cx - globe.r, globe.cy - globe.r, globe.r * 2, globe.r * 2);
    drawFallbackSurfaceDetail(ctx, globe, body, palette);
    ctx.restore();
  }

  function parseRgbTriplet(hex) {
    if (typeof hex !== "string" || !hex.startsWith("#")) return [80, 100, 120];
    const clean = hex.slice(1);
    const n = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function inverseRotatePoint(x, y, z) {
    const cx = Math.cos(-state.planetRotation.lat);
    const sx = Math.sin(-state.planetRotation.lat);
    const y1 = y * cx - z * sx;
    const z1 = y * sx + z * cx;
    const cy = Math.cos(-state.planetRotation.lon);
    const sy = Math.sin(-state.planetRotation.lon);
    const x0 = x * cy + z1 * sy;
    const z0 = -x * sy + z1 * cy;
    return { x: x0, y: y1, z: z0 };
  }

  function drawLocalSatellites(ctx, globe, body) {
    if (state.settings.disableSatellites) return;
    if (state.planetCamera.zoom > 0.72) return;
    const satellites = state.data.bodies.filter(b => b.parentBodyId === body.id);
    if (!satellites.length) return;
    ctx.save();
    ctx.strokeStyle = "rgba(156, 194, 220, .15)";
    ctx.lineWidth = 1;
    satellites.forEach((sat, idx) => {
      const ringR = globe.r + 190 + idx * 70;
      ctx.beginPath();
      ctx.ellipse(globe.cx, globe.cy, ringR, ringR * .42, -0.32, 0, Math.PI * 2);
      ctx.stroke();
      const angle = ((state.animationTime * (sat.moonOrbitSpeed || 0.00008)) + (sat.moonOrbitOffset || 0)) % (Math.PI * 2);
      const sx = globe.cx + Math.cos(angle) * ringR;
      const sy = globe.cy + Math.sin(angle) * ringR * .42 - Math.sin(-0.32) * 6;
      const sr = Math.max(12, (sat.radius || 10) * 1.28);
      drawBody(ctx, sat, sx, sy, sr, 1, true);
      state.planetHits.push({ kind: "body", id: sat.id, x: sx, y: sy, r: sr + 6 });
      if (state.planetCamera.zoom < 1.6 && !state.settings.disableNames && !state.settings.disableSatelliteNames) {
        ctx.save();
        ctx.font = "11px Arial Narrow, Bahnschrift, sans-serif";
        ctx.fillStyle = "rgba(237,245,255,.76)";
        ctx.textAlign = "center";
        ctx.fillText((sat.shortName || sat.name).toUpperCase(), sx, sy + sr + 13);
        ctx.restore();
      }
    });
    ctx.restore();
  }

  function terrainDetailLevel() {
    const z = state.planetCamera.zoom;
    if (z >= 7) return 3;
    if (z >= 2.2) return 2;
    return 1;
  }

  function drawTerrainOnGlobe(ctx, globe, bodyId) {
    const terrain = state.data.terrain.filter(item => item.bodyId === bodyId && canSee(item));
    const lod = terrainDetailLevel();
    for (const item of terrain) {
      const { lon, lat } = coordinateToLonLat(item.x, item.y);
      const projected = projectSphere(lon, lat, globe);
      if (!projected.visible || projected.z < .04) continue;
      const scale = (.48 + projected.z * .52) * (0.75 + Math.min(1.3, state.planetCamera.zoom * 0.15));
      const w = item.w * globe.r * 1.55 * scale;
      const h = item.h * globe.r * 1.22 * scale;
      ctx.save();
      ctx.translate(projected.x, projected.y);
      ctx.rotate(item.rotation || 0);
      switch (item.type) {
        case "mountain": drawMountainFeature(ctx, w, h, item, lod, bodyId); break;
        case "forest": drawForestFeature(ctx, w, h, item, lod); break;
        case "road": drawRoadFeature(ctx, w, h, item, lod); break;
        case "cityscape": drawCityscapeFeature(ctx, w, h, item, lod, bodyId); break;
        case "lake": drawLakeFeature(ctx, w, h, item, lod); break;
        case "dunes": drawDuneFeature(ctx, w, h, item, lod); break;
        case "swamp": drawSwampFeature(ctx, w, h, item, lod); break;
        case "toxic": drawToxicFeature(ctx, w, h, item, lod); break;
        case "cloud": drawCloudFeature(ctx, w, h, item, lod); break;
        case "craters": drawCraterFeature(ctx, w, h, item, lod); break;
        default: drawLakeFeature(ctx, w, h, item, lod); break;
      }
      ctx.restore();
      if (lod >= 3) state.planetHits.push({ kind: "terrain", id: item.id, x: projected.x, y: projected.y, r: Math.max(12, Math.max(w, h) * .28) });
    }
  }

  function drawMountainFeature(ctx, w, h, item, lod, bodyId) {
    const snowy = bodyId === "osiris-prime";
    const peaks = Math.max(3, Math.round(4 + item.density * 5));
    const baseY = h * .32;
    for (let i = 0; i < peaks; i++) {
      const x = -w * .5 + (i / Math.max(1, peaks - 1)) * w;
      const peakH = h * (.45 + (i % 3) * .15);
      ctx.fillStyle = snowy ? "rgba(118,132,145,.92)" : "rgba(134,96,62,.92)";
      ctx.beginPath();
      ctx.moveTo(x - w / peaks * .75, baseY);
      ctx.lineTo(x, baseY - peakH);
      ctx.lineTo(x + w / peaks * .75, baseY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = snowy ? "rgba(234,242,250,.8)" : "rgba(189,151,94,.52)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 1, baseY - peakH + 4);
      ctx.lineTo(x - w / peaks * .22, baseY - peakH * .35);
      ctx.lineTo(x + w / peaks * .12, baseY - peakH * .1);
      ctx.stroke();
    }
  }

  function drawForestFeature(ctx, w, h, item, lod) {
    const cols = Math.max(3, Math.round(4 + item.density * 6));
    const rows = Math.max(2, lod + 1);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = -w * .48 + (col / Math.max(1, cols - 1)) * w + ((row % 2) * w / cols * .3);
        const y = -h * .18 + (row / Math.max(1, rows - 1)) * h * .55;
        const size = Math.max(8, (w / cols) * (.25 + item.density * .35));
        ctx.fillStyle = row % 2 ? "rgba(24,84,39,.95)" : "rgba(54,132,72,.92)";
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size * .7, y + size * .35);
        ctx.lineTo(x + size * .7, y + size * .35);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(54,40,28,.8)";
        ctx.fillRect(x - 1, y + size * .35, 2, size * .32);
      }
    }
  }

  function drawRoadFeature(ctx, w, h, item, lod) {
    ctx.strokeStyle = "rgba(190,205,218,.78)";
    ctx.lineWidth = Math.max(3, h * .12);
    ctx.beginPath();
    ctx.moveTo(-w * .48, h * .2);
    ctx.bezierCurveTo(-w * .18, -h * .48, w * .14, h * .42, w * .46, -h * .12);
    ctx.stroke();
    if (lod >= 2 && !state.settings.disablePois && !state.settings.disableNames) {
      ctx.strokeStyle = "rgba(28,41,52,.95)";
      ctx.lineWidth = Math.max(1, h * .03);
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(-w * .46, h * .18);
      ctx.bezierCurveTo(-w * .16, -h * .44, w * .16, h * .40, w * .44, -h * .10);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawCityscapeFeature(ctx, w, h, item, lod, bodyId) {
    const cool = bodyId === "osiris-prime" || bodyId === "vulkan-ii";
    const buildingCount = Math.max(4, Math.round(4 + item.density * 7));
    ctx.fillStyle = cool ? "rgba(174,194,214,.90)" : "rgba(196,175,145,.90)";
    for (let i = 0; i < buildingCount; i++) {
      const bw = w / buildingCount * (.55 + (i % 3) * .1);
      const bh = h * (.3 + ((i*7)%5) * .11);
      const x = -w * .5 + i * (w / buildingCount) + bw * .1;
      const y = h * .18 - bh;
      ctx.fillRect(x, y, bw, bh);
      if (lod >= 2) {
        ctx.fillStyle = "rgba(109,247,255,.38)";
        ctx.fillRect(x + bw * .2, y + bh * .18, bw * .15, bh * .15);
        ctx.fillRect(x + bw * .55, y + bh * .33, bw * .12, bh * .12);
        ctx.fillStyle = cool ? "rgba(174,194,214,.90)" : "rgba(196,175,145,.90)";
      }
    }
    ctx.fillStyle = "rgba(60,76,89,.72)";
    ctx.fillRect(-w * .54, h * .18, w * 1.08, h * .08);
  }

  function drawLakeFeature(ctx, w, h) {
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h));
    grad.addColorStop(0, "rgba(171,229,255,.74)");
    grad.addColorStop(.6, "rgba(46,126,177,.56)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(0, 0, w * .52, h * .42, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawDuneFeature(ctx, w, h, item, lod) {
    for (let i = -2; i <= 2; i++) {
      ctx.strokeStyle = i % 2 === 0 ? "rgba(214,162,92,.85)" : "rgba(158,99,43,.85)";
      ctx.lineWidth = Math.max(3, h * .08);
      ctx.beginPath();
      ctx.moveTo(-w * .54, i * h * .12);
      ctx.bezierCurveTo(-w * .18, i * h * .05 - h * .18, w * .18, i * h * .18 + h * .16, w * .52, i * h * .02 - h * .06);
      ctx.stroke();
    }
  }

  function drawSwampFeature(ctx, w, h) {
    ctx.fillStyle = "rgba(76,109,41,.55)";
    ctx.beginPath(); ctx.ellipse(0, 0, w * .52, h * .42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(147,184,67,.35)";
    ctx.beginPath(); ctx.ellipse(-w * .08, -h * .06, w * .18, h * .12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(w * .14, h * .08, w * .15, h * .09, 0, 0, Math.PI * 2); ctx.fill();
  }

  function drawToxicFeature(ctx, w, h) {
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h));
    grad.addColorStop(0, "rgba(189,255,86,.35)");
    grad.addColorStop(.4, "rgba(130,197,42,.25)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(0, 0, w * .52, h * .38, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(220,255,130,.35)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, w * .42, h * .30, .3, 0, Math.PI * 2); ctx.stroke();
  }

  function drawCloudFeature(ctx, w, h) {
    ctx.fillStyle = "rgba(236,247,255,.24)";
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(i * w * .16, Math.sin(i) * h * .05, w * .18, h * .12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCraterFeature(ctx, w, h, item, lod) {
    const count = Math.max(4, Math.round(4 + item.density * 6));
    for (let i = 0; i < count; i++) {
      const rx = w * (.10 + (i % 4) * .05);
      const ry = h * (.10 + ((i*3)%4) * .03);
      const x = -w * .40 + (i / Math.max(1, count - 1)) * w * .8;
      const y = -h * .22 + Math.sin(i * 1.7) * h * .18;
      ctx.strokeStyle = "rgba(221,228,236,.56)";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, .2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "rgba(78,83,94,.18)";
      ctx.beginPath(); ctx.ellipse(x + 2, y + 2, rx * .72, ry * .72, .2, 0, Math.PI * 2); ctx.fill();
    }
  }


  function tracePolygon(ctx, sides, radius, rotation = -Math.PI / 2, sx = 1, sy = 1) {
    for (let i = 0; i < sides; i++) {
      const a = rotation + i * Math.PI * 2 / sides;
      const x = Math.cos(a) * radius * sx;
      const y = Math.sin(a) * radius * sy;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function traceKite(ctx, size) {
    ctx.moveTo(0, -size * 1.08);
    ctx.lineTo(size * .66, -size * .18);
    ctx.lineTo(0, size * 1.18);
    ctx.lineTo(-size * .66, -size * .18);
    ctx.closePath();
  }

  function traceMilitaryPad(ctx, size) {
    ctx.moveTo(-size * .88, size * .62);
    ctx.lineTo(-size * .88, -.12 * size);
    ctx.lineTo(-size * .45, -.82 * size);
    ctx.lineTo(size * .45, -.82 * size);
    ctx.lineTo(size * .88, -.12 * size);
    ctx.lineTo(size * .88, size * .62);
    ctx.lineTo(size * .3, size * .62);
    ctx.quadraticCurveTo(size * .15, size * .12, 0, size * .08);
    ctx.quadraticCurveTo(-size * .15, size * .12, -size * .3, size * .62);
    ctx.closePath();
  }

  function drawFlag(ctx, x, y, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1.2, size * .12);
    ctx.beginPath();
    ctx.moveTo(x, y + size * .6);
    ctx.lineTo(x, y - size * .5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - size * .46);
    ctx.lineTo(x + size * .66, y - size * .26);
    ctx.lineTo(x, y - size * .02);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawNorthStar(ctx, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.4, size * .12);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size);
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.moveTo(-size * .68, -size * .68);
    ctx.lineTo(size * .68, size * .68);
    ctx.moveTo(size * .68, -size * .68);
    ctx.lineTo(-size * .68, size * .68);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, size * .2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawHazardIcon(ctx, kind, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(2.4, size * .16);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (kind === "bio") {
      ctx.beginPath();
      ctx.arc(0, 0, size * .13, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * size * .22, Math.sin(a) * size * .22, size * .46, a + 0.62, a - 0.62, true);
        ctx.stroke();
      }
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * size * .06, Math.sin(a) * size * .06);
        ctx.lineTo(Math.cos(a) * size * .32, Math.sin(a) * size * .32);
        ctx.stroke();
      }
    } else if (kind === "radiation") {
      ctx.beginPath();
      ctx.arc(0, 0, size * .14, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - .34) * size * .3, Math.sin(a - .34) * size * .3);
        ctx.arc(0, 0, size * .84, a - .34, a + .34);
        ctx.lineTo(Math.cos(a + .16) * size * .3, Math.sin(a + .16) * size * .3);
        ctx.closePath();
        ctx.fill();
      }
    } else if (kind === "fire") {
      ctx.beginPath();
      ctx.moveTo(0, -size * .98);
      ctx.bezierCurveTo(size * .42, -size * .62, size * .88, -size * .02, size * .42, size * .56);
      ctx.lineTo(size * .16, size * .36);
      ctx.bezierCurveTo(size * .2, size * .84, -size * .12, size * .98, -size * .4, size * .68);
      ctx.bezierCurveTo(-size * .92, size * .1, -size * .44, -size * .48, 0, -size * .98);
      ctx.closePath();
      ctx.stroke();
    } else if (kind === "cold") {
      for (let i = 0; i < 3; i++) {
        const a = i * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * -size, Math.sin(a) * -size);
        ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
        ctx.stroke();
        for (const s of [-1, 1]) {
          const bx = Math.cos(a) * s * size * .52;
          const by = Math.sin(a) * s * size * .52;
          for (const d of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.lineTo(bx + Math.cos(a + d * .72) * size * .26, by + Math.sin(a + d * .72) * size * .26);
            ctx.stroke();
          }
        }
      }
    } else {
      ctx.beginPath();
      ctx.arc(-size * .34, -size * .08, size * .26, Math.PI, Math.PI * 1.82);
      ctx.arc(0, -size * .18, size * .38, Math.PI * .98, Math.PI * 1.98);
      ctx.arc(size * .32, -size * .08, size * .28, Math.PI * 1.12, Math.PI * 2.02);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-size * .62, size * .16); ctx.lineTo(size * .26, size * .16); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-size * .52, size * .42); ctx.lineTo(size * .12, size * .42); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size * .2, size * .02);
      ctx.lineTo(size * .62, size * .02);
      ctx.lineTo(size * .34, size * .58);
      ctx.lineTo(size * .68, size * .58);
      ctx.lineTo(size * .1, size * 1.1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRadarIcon(ctx, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1.8, size * .15);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(0, 0, size * .22, 0, Math.PI * 2);
    ctx.fill();
    for (const r of [.42, .7, .96]) {
      ctx.beginPath();
      ctx.arc(0, 0, size * r, -Math.PI * .88, Math.PI * .88);
      ctx.stroke();
    }
    ctx.globalAlpha = .22;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, size * .96, -Math.PI * .38, Math.PI * .04);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(-Math.PI * .18) * size * .95, Math.sin(-Math.PI * .18) * size * .95);
    ctx.stroke();
    for (const p of [[.45,-.52],[.78,.34],[-.6,.22]]) {
      ctx.beginPath(); ctx.arc(size * p[0], size * p[1], size * .1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawEyeIcon(ctx, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1.3, size * .12);
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.quadraticCurveTo(0, -size * .78, size, 0);
    ctx.quadraticCurveTo(0, size * .78, -size, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, size * .28, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawCanisterIcon(ctx, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1.25, size * .1);
    roundedRect(ctx, -size * .42, -size * .76, size * .84, size * 1.52, size * .2);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-size * .26, -size * .95); ctx.lineTo(size * .26, -size * .95); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-size * .24, 0); ctx.lineTo(size * .24, 0); ctx.stroke();
    ctx.restore();
  }

  function drawTowerIcon(ctx, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1.25, size * .1);
    ctx.beginPath();
    ctx.moveTo(0, -size * .98);
    ctx.lineTo(size * .58, -size * .42);
    ctx.lineTo(size * .72, size * .96);
    ctx.moveTo(0, -size * .98);
    ctx.lineTo(-size * .58, -size * .42);
    ctx.lineTo(-size * .72, size * .96);
    ctx.moveTo(-size * .56, size * .32); ctx.lineTo(size * .56, size * .32);
    ctx.moveTo(-size * .38, -size * .08); ctx.lineTo(size * .38, -size * .08);
    ctx.moveTo(-size * .56, size * .96); ctx.lineTo(size * .56, size * .96);
    ctx.stroke();
    ctx.beginPath(); roundedRect(ctx, -size * .34, -size * 1.08, size * .68, size * .28, size * .08); ctx.fill();
    drawFlag(ctx, size * .04, -size * 1.16, size * .34, color);
    ctx.restore();
  }

  function drawPoiIconGlyph(ctx, iconId, color, size) {
    const id = iconId || "exploration-star";
    const accent = color || "#c7d2e0";
    const fillSoft = accent + '33';
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = accent;
    ctx.fillStyle = fillSoft;
    ctx.lineWidth = Math.max(1.4, size * .14);

    const circleStyle = (variant) => {
      if (variant === 'village') {
        ctx.beginPath(); ctx.arc(0,0,size*.82,0,Math.PI*2); ctx.stroke();
      } else if (variant === 'town') {
        ctx.beginPath(); ctx.arc(0,0,size*.72,0,Math.PI*2); ctx.fillStyle = accent; ctx.globalAlpha = .95; ctx.fill(); ctx.globalAlpha = 1;
      } else if (variant === 'city') {
        ctx.beginPath(); ctx.arc(0,0,size*.88,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0,0,size*.52,0,Math.PI*2); ctx.stroke();
      } else if (variant === 'capital') {
        ctx.beginPath(); ctx.arc(0,0,size*.88,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0,0,size*.52,0,Math.PI*2); ctx.stroke();
        for (let i=0;i<4;i++) {
          const a = -Math.PI/2 + i*Math.PI/2;
          const x = Math.cos(a)*size*1.08, y = Math.sin(a)*size*1.08;
          ctx.beginPath();
          if (i % 2 === 0) {
            ctx.moveTo(x, y + (i===0?-size*.12:size*.12));
            ctx.lineTo(x-size*.11, y + (i===0?size*.1:-size*.1));
            ctx.lineTo(x+size*.11, y + (i===0?size*.1:-size*.1));
          } else {
            ctx.moveTo(x + (i===1?size*.12:-size*.12), y);
            ctx.lineTo(x + (i===1?-size*.1:size*.1), y-size*.11);
            ctx.lineTo(x + (i===1?-size*.1:size*.1), y+size*.11);
          }
          ctx.closePath(); ctx.fillStyle = accent; ctx.fill();
        }
      }
    };

    const tierShape = (shape, tier) => {
      const trace = (scale=1) => {
        ctx.beginPath();
        if (shape === 'triangle') tracePolygon(ctx, 3, size * .9 * scale);
        else if (shape === 'diamond') tracePolygon(ctx, 4, size * .92 * scale);
        else if (shape === 'pentagon') tracePolygon(ctx, 5, size * .9 * scale);
        else if (shape === 'square') tracePolygon(ctx, 4, size * .86 * scale, Math.PI/4);
        else if (shape === 'octagon') tracePolygon(ctx, 8, size * .88 * scale, Math.PI/8);
        else if (shape === 'oval') tracePolygon(ctx, 20, size * .84 * scale, -Math.PI/2, 1.18, .8);
        else if (shape === 'rectangle') { roundedRect(ctx, -size*.96*scale, -size*.6*scale, size*1.92*scale, size*1.2*scale, size*.18*scale); }
        else if (shape === 'kite') traceKite(ctx, size * .86 * scale);
      };
      if (tier === 'outline') { trace(1); ctx.stroke(); }
      else if (tier === 'filled') { trace(1); ctx.fillStyle = fillSoft; ctx.fill(); ctx.stroke(); }
      else { trace(1.12); ctx.stroke(); trace(.68); ctx.fillStyle = fillSoft; ctx.fill(); ctx.stroke(); }
    };

    if (id.startsWith('settlement-')) {
      circleStyle(id.split('-')[1]);
    } else if (id.startsWith('military-')) {
      const variant = id.split('-')[1];
      if (variant === 'fob' || variant === 'base') {
        ctx.beginPath(); traceMilitaryPad(ctx, size*.96);
        if (variant === 'base') { ctx.fillStyle = fillSoft; ctx.fill(); }
        ctx.stroke();
      } else {
        ctx.beginPath(); traceMilitaryPad(ctx, size*.96); ctx.fillStyle = fillSoft; ctx.fill(); ctx.stroke();
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); roundedRect(ctx, -size*.24, -size*.1, size*.48, size*.54, size*.12); ctx.fill();
        ctx.restore();
        ctx.beginPath(); roundedRect(ctx, -size*.24, -size*.1, size*.48, size*.54, size*.12); ctx.stroke();
        if (variant === 'command') drawFlag(ctx, 0, -size*.25, size*.62, accent);
      }
    } else if (id.startsWith('outpost-')) {
      const variant = id.split('-')[1];
      if (variant === 'listening') drawRadarIcon(ctx, size*1.08, accent);
      else if (variant === 'observation') drawEyeIcon(ctx, size*.9, accent);
      else if (variant === 'logistics') drawCanisterIcon(ctx, size*.9, accent);
      else drawTowerIcon(ctx, size*.82, accent);
    } else if (id.startsWith('resource-')) {
      const tier = id.split('-')[1] === 'minor' ? 'outline' : id.split('-')[1] === 'standard' ? 'filled' : 'major';
      tierShape('triangle', tier);
    } else if (id.startsWith('production-')) {
      const tier = id.split('-')[1] === 'minor' ? 'outline' : id.split('-')[1] === 'standard' ? 'filled' : 'major';
      tierShape('diamond', tier);
    } else if (id === 'exploration-star') {
      drawNorthStar(ctx, size*.82, accent);
    } else if (id.startsWith('hazard-')) {
      drawHazardIcon(ctx, id.split('-')[1], size*1.02, accent);
    } else if (id.startsWith('tactical-')) {
      const parts = id.split('-');
      tierShape(parts[1], parts[2] === 'major' ? 'major' : parts[2] === 'filled' ? 'filled' : 'outline');
    } else {
      drawNorthStar(ctx, size*.8, accent);
    }
    ctx.restore();
  }

  function renderIconChip(container, iconId, color, size = 28) {
    if (!container) return;
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    const px = Math.max(24, Math.round(size * (window.devicePixelRatio || 1)));
    canvas.width = px;
    canvas.height = px;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ictx = canvas.getContext('2d');
    ictx.scale(px / size, px / size);
    ictx.translate(size / 2, size / 2);
    drawPoiIconGlyph(ictx, iconId, color, size * .34);
    container.appendChild(canvas);
  }

  function drawPoiModel(ctx, projected, poi, perspective, lod) {
    const faction = factionById(poi.factionId);
    const icon = templateById(poi.modelTemplateId || defaultIconForType(poi.type));
    const size = (lod >= 3 ? 18 : lod >= 2 ? 15 : 12) * perspective * poiDisplaySizeValue(poi);

    ctx.save();
    ctx.translate(projected.x, projected.y);
    ctx.shadowColor = poiRenderColor(poi);
    ctx.shadowBlur = 12;
    if (!state.settings.disablePois && !state.settings.disablePoiIcons) drawPoiIconGlyph(ctx, icon.id, poiRenderColor(poi), size);
    ctx.shadowBlur = 0;

    if (lod >= 2 && !state.settings.disablePois && !state.settings.disableNames) {
      const textScale = poiTextSizeValue(poi);
      const fontSize = Math.round((lod >= 3 ? 12 : 11) * textScale);
      ctx.font = `${fontSize}px Arial Narrow, Bahnschrift, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(244,248,255,.92)";
      ctx.shadowColor = "rgba(0,0,0,.95)";
      ctx.shadowBlur = Math.max(7, Math.round(fontSize * .58));
      ctx.fillText(poi.name.toUpperCase(), 0, size + Math.max(7, Math.round(fontSize * .38)));
    }
    ctx.restore();
  }

  function drawPoisOnGlobe(ctx, globe, bodyId) {
    const pois = poisForBody(bodyId, { visibleOnly: true }).filter(shouldRenderPoiOnMap);
    const lod = terrainDetailLevel();
    for (const poi of pois) {
      const { lon, lat } = coordinateToLonLat(poi.x, poi.y);
      const projected = projectSphere(lon, lat, globe);
      if (!projected.visible || projected.z < .03) continue;
      const perspective = .58 + projected.z * .42;
      drawPoiModel(ctx, projected, poi, perspective, lod);
      const r = 14 * perspective;
      state.planetHits.push({ kind: "poi", id: poi.id, x: projected.x, y: projected.y, r: r + 10, z: projected.z });
    }
  }

  function onPlanetMouseMove(event) {
    if (state.dragCamera?.view === "planet") return;
    const hit = hitTest(state.planetHits, getCanvasWorldPoint(event, els.planetCanvas, state.planetCamera));
    if (!hit) {
      clearHover();
      return;
    }
    if (hit.kind === "poi") {
      const poi = state.data.pois.find(p => p.id === hit.id);
      if (poi) showHover(event.clientX, event.clientY, poiHoverHtml(poi), `poi:${poi.id}`);
      return;
    }
    if (hit.kind === "terrain") {
      const terrain = state.data.terrain.find(t => t.id === hit.id);
      if (terrain) showHover(event.clientX, event.clientY, terrainHoverHtml(terrain), `terrain:${terrain.id}`);
      return;
    }
    if (hit.kind === "body") {
      const body = bodyById(hit.id);
      if (body) showHover(event.clientX, event.clientY, bodyHoverHtml(body), `body:${body.id}`);
    }
  }

  function onPlanetAuxClick(event) {
    if (event.button === 1 && (state.role === "command" || isAdmin())) {
      event.preventDefault();
      onPlanetMiddleMouse(event);
    }
  }

  function onPlanetMiddleMouse(event) {
    if (!(state.role === "command" || isAdmin())) return;
    const point = getCanvasWorldPoint(event, els.planetCanvas, state.planetCamera);
    const { width, height } = els.planetCanvas.getBoundingClientRect();
    const body = bodyById(state.selectedBodyId);
    if (!bodyHasTheater(body)) return;
    const coords = state.planetViewMode === "flat"
      ? screenPointToFlatMapCoords(point, flatMapBounds(width, height))
      : screenPointToPlanetCoords(point, globeBounds(width, height, body));
    if (!coords) return;
    const forceType = state.role === "command" && !isAdmin() ? "tactical" : undefined;
    showQuickPoiEditor({ mode: "create", bodyId: body.id, x: coords.x, y: coords.y, forceType });
  }

  function onPlanetContextMenu(event) {
    if (!isAdmin()) return;
    event.preventDefault();
    hideQuickPoiMenu();
    const point = getCanvasWorldPoint(event, els.planetCanvas, state.planetCamera);
    const hit = hitTest(state.planetHits, point);
    if (hit?.kind === "poi") {
      const poi = state.data.pois.find(p => p.id === hit.id);
      if (poi) return showQuickPoiMenu(event.clientX, event.clientY, poi);
    }
  }

  function onPlanetClick(event) {
    if (state.suppressPlanetClick) {
      state.suppressPlanetClick = false;
      return;
    }
    const point = getCanvasWorldPoint(event, els.planetCanvas, state.planetCamera);
    const hit = hitTest(state.planetHits, point);
    if (hit) {
      if (hit.kind === "poi") {
        const poi = state.data.pois.find(p => p.id === hit.id);
        if (!poi) return;
        state.selectedPoiId = poi.id;
        state.selectedTerrainId = null;
        state.selectedBodyId = poi.bodyId;
        renderAllPanels();
        return;
      }
      if (hit.kind === "terrain") {
        const terrain = state.data.terrain.find(t => t.id === hit.id);
        if (!terrain) return;
        state.selectedPoiId = null;
        state.selectedTerrainId = terrain.id;
        state.selectedBodyId = terrain.bodyId;
        if (isStaff()) loadTerrainIntoForm(terrain);
        renderAllPanels();
        showDetailForTerrain(terrain);
        return;
      }
      if (hit.kind === "body") {
        const body = bodyById(hit.id);
        if (!body) return;
        state.selectedPoiId = null;
        state.selectedTerrainId = null;
        if (bodyHasTheater(body)) state.selectedBodyId = body.id;
        renderAllPanels();
        return;
      }
    }

    if (state.placementMode && isStaff()) {
      const { width, height } = els.planetCanvas.getBoundingClientRect();
      const body = bodyById(state.selectedBodyId);
      const coords = state.planetViewMode === "flat"
        ? screenPointToFlatMapCoords(point, flatMapBounds(width, height))
        : screenPointToPlanetCoords(point, globeBounds(width, height, body));
      if (coords) {
        const x = clamp(coords.x, 0, 1);
        const y = clamp(coords.y, 0, 1);
        state.planetPlacement = { x, y };
        els.poiBody.value = state.selectedBodyId;
        els.poiX.value = x.toFixed(3);
        els.poiY.value = y.toFixed(3);
        if (els.terrainBody) {
          els.terrainBody.value = state.selectedBodyId;
          els.terrainX.value = x.toFixed(3);
          els.terrainY.value = y.toFixed(3);
        }
        els.placementReadout.textContent = `Captured ${state.planetViewMode === "flat" ? "map" : "globe"} coordinates: X ${x.toFixed(3)}, Y ${y.toFixed(3)}. Continue in POI Editor.`;
        setView("admin");
      }
    }
  }

  function terrainHoverHtml(terrain) {
    const body = bodyById(terrain.bodyId);
    return `
      <h3>${escapeHtml(terrain.name)}</h3>
      <p>${escapeHtml(terrain.type.replace("_", " "))} / ${escapeHtml(body?.name || "Unknown body")}</p>
      <p>${escapeHtml(terrain.hazard || "No additional terrain note entered.")}</p>
    `;
  }

  function poiHoverHtml(poi) {
    const body = bodyById(poi.bodyId);
    const faction = factionById(poi.factionId);
    const type = typeById(poi.type);
    return `
      <h3>${escapeHtml(poi.name)}</h3>
      <p>${escapeHtml(type.label)} / ${escapeHtml(poi.subtype || "Unspecified")}</p>
      <p>${escapeHtml(body.name)} — ${escapeHtml(faction.name)}</p>
      <p>${escapeHtml((poi.description || "No strategic paragraph entered.").slice(0, 130))}${poi.description?.length > 130 ? "…" : ""}</p>
    `;
  }

  function showDetailForBody(body) {
    const control = calculateBodyControl(body.id, currentIntelIsActual());
    const bars = factionBreakdownHtml(control);
    const childBodies = state.data.bodies.filter(b => b.parentBodyId === body.id);
    const childHtml = childBodies.length ? `
      <p><strong>Linked Bodies:</strong> ${childBodies.map(child => escapeHtml(child.name)).join(", ")}</p>
    ` : "";
    const poiCount = poisForBody(body.id, { visibleOnly: true }).length;
    els.dialogEyebrow.textContent = titleCase(body.type).toUpperCase();
    els.dialogTitle.textContent = body.name;
    els.dialogBody.innerHTML = `
      <p>${escapeHtml(body.description || "No briefing text entered for this body.")}</p>
      ${childHtml}
      <p><strong>Status:</strong> ${escapeHtml(body.statusLabel || "Unclassified theater")}</p>
      <p><strong>Visible POIs:</strong> ${poiCount}</p>
      ${bars}
      ${bodyHasTheater(body) ? `<div class="dialog-actions"><button class="primary-button" type="button" data-open-theater-body="${escapeHtml(body.id)}">Open Planet Theater</button></div>` : `<p><em>No globe theater for this asset. Inspect associated POIs from the strategic list.</em></p>`}
    `;
    els.detailDialog.showModal();
  }

  function showDetailForPoi(poi) {
    const body = bodyById(poi.bodyId);
    const type = typeById(poi.type);
    const faction = factionById(poi.factionId);
    const template = templateById(poi.modelTemplateId);
    const sector = state.data.sectors.find(s => s.id === poi.sectorId);
    const staffNotes = isGmPlus() && poi.gmNotes ? `<p><strong>GM Notes:</strong> ${escapeHtml(poi.gmNotes)}</p>` : "";
    els.dialogEyebrow.textContent = `${type.label.toUpperCase()} / ${faction.code}`;
    els.dialogTitle.textContent = poi.name;
    els.dialogBody.innerHTML = `
      <p>${escapeHtml(poi.description || "No strategic paragraph has been entered for this point yet.")}</p>
      <p><strong>Theater:</strong> ${escapeHtml(body.name)}<br>
      <strong>Subtype:</strong> ${escapeHtml(poi.subtype || "Unspecified")}<br>
      <strong>Icon:</strong> ${escapeHtml(template.label)}<br>
      <strong>Strategic Tier:</strong> ${escapeHtml(tierLabel(poi.strategicTier || tierFromValue(Number(poi.strategicValue || 0))))}<br>
      <strong>Strategic Value:</strong> ${Number(poi.strategicValue || 0)}<br>
      <strong>Tactical Value:</strong> ${Number(poi.tacticalValue || 0)}<br>
      <strong>Visibility:</strong> ${escapeHtml(poi.visibility || "public")}${sector ? `<br><strong>Sector:</strong> ${escapeHtml(sector.name)}` : ""}</p>
      ${staffNotes}
    `;
    els.detailDialog.showModal();
  }


  function showDetailForTerrain(terrain) {
    const body = bodyById(terrain.bodyId);
    els.dialogEyebrow.textContent = `${String(terrain.type || "terrain").replace("_", " ").toUpperCase()} / TERRAFORMING`;
    els.dialogTitle.textContent = terrain.name;
    els.dialogBody.innerHTML = `
      <p>${escapeHtml(terrain.hazard || "No additional terrain note entered for this feature.")}</p>
      <p><strong>Theater:</strong> ${escapeHtml(body?.name || "Unknown")}<br>
      <strong>Coordinates:</strong> ${Number(terrain.x || 0).toFixed(3)}, ${Number(terrain.y || 0).toFixed(3)}<br>
      <strong>Span:</strong> ${Number(terrain.w || 0).toFixed(2)} × ${Number(terrain.h || 0).toFixed(2)}<br>
      <strong>Density:</strong> ${Number(terrain.density || 0).toFixed(2)}</p>
      ${bodyHasTheater(body) ? `<div class="dialog-actions"><button class="primary-button" type="button" data-open-theater-body="${escapeHtml(body.id)}">Open Planet Theater</button></div>` : ""}
    `;
    els.detailDialog.showModal();
  }
  function renderSystemControlPanel() {
    const actual = currentIntelIsActual();
    const control = calculateSystemControl(actual);
    els.controlModePill.textContent = roleLabel();
    els.systemControlBars.innerHTML = state.data.factions.map(faction => {
      const score = control.scores[faction.id] || 0;
      const pct = control.total ? score / control.total * 100 : 0;
      return `
        <div class="control-row">
          <div class="control-label"><span>${escapeHtml(faction.name)}</span><span>${formatPercent(pct)}</span></div>
          <div class="meter"><div class="meter-fill" style="width:${pct}%;color:${faction.color};background:${faction.color}"></div></div>
        </div>
      `;
    }).join("");
    els.calculationNote.innerHTML = "";
  }

  function calculateSystemControl(actual = false) {
    const cacheKey = `${state.dataRevision}:${actual ? 1 : 0}`;
    if (state.systemControlCache.has(cacheKey)) return state.systemControlCache.get(cacheKey);
    const scores = Object.fromEntries(state.data.factions.map(f => [f.id, 0]));
    let total = 0;
    const overriddenBodies = new Set(state.data.bodies.filter(body => manualBodyControl(body)).map(body => body.id));
    for (const poi of state.data.pois) {
      if (overriddenBodies.has(poi.bodyId) || (!actual && !canSeeForPublic(poi))) continue;
      const val = Number(poi.strategicValue || 0);
      scores[poi.factionId] = (scores[poi.factionId] || 0) + val;
      total += val;
    }
    for (const bonus of calculateSectorBonuses(actual)) {
      if (overriddenBodies.has(bonus.bodyId)) continue;
      scores[bonus.factionId] = (scores[bonus.factionId] || 0) + bonus.value;
      total += bonus.value;
    }
    for (const body of state.data.bodies) {
      const manual = manualBodyControl(body);
      if (!manual) continue;
      for (const faction of state.data.factions) scores[faction.id] = (scores[faction.id] || 0) + Number(manual.scores[faction.id] || 0);
      total += manual.total;
    }
    const result = { scores, total };
    state.systemControlCache.set(cacheKey, result);
    return result;
  }

  function calculateBodyControl(bodyId, actual = false) {
    const cacheKey = `${state.dataRevision}:${actual ? 1 : 0}:${bodyId}`;
    if (state.controlCache.has(cacheKey)) return state.controlCache.get(cacheKey);
    const body = bodyById(bodyId);
    const manual = manualBodyControl(body);
    if (manual) { state.controlCache.set(cacheKey, manual); return manual; }

    const scores = Object.fromEntries(state.data.factions.map(f => [f.id, 0]));
    let total = 0;
    for (const poi of state.data.pois) {
      if (poi.bodyId !== bodyId || (!actual && !canSeeForPublic(poi))) continue;
      const val = Number(poi.strategicValue || 0);
      scores[poi.factionId] = (scores[poi.factionId] || 0) + val;
      total += val;
    }
    for (const bonus of calculateSectorBonuses(actual)) {
      if (bonus.bodyId !== bodyId) continue;
      scores[bonus.factionId] = (scores[bonus.factionId] || 0) + bonus.value;
      total += bonus.value;
    }
    for (const child of state.data.bodies) {
      if (child.parentBodyId !== bodyId) continue;
      const childManual = manualBodyControl(child);
      if (!childManual) continue;
      for (const faction of state.data.factions) scores[faction.id] = (scores[faction.id] || 0) + Number(childManual.scores[faction.id] || 0);
      total += childManual.total;
    }
    const result = { scores, total };
    state.controlCache.set(cacheKey, result);
    return result;
  }

  function canSeeForPublic(item) {
    const visibility = item.visibility || "public";
    return visibility === "public" || visibility === "discovered";
  }

  function calculateSectorBonuses(actual = false) {
    const cacheKey = `${state.dataRevision}:${actual ? 1 : 0}`;
    if (state.sectorBonusCache.has(cacheKey)) return state.sectorBonusCache.get(cacheKey);
    const visiblePois = actual ? state.data.pois : state.data.pois.filter(canSeeForPublic);
    const poisBySector = new Map();
    for (const poi of visiblePois) {
      if (!poi.sectorId) continue;
      if (!poisBySector.has(poi.sectorId)) poisBySector.set(poi.sectorId, []);
      poisBySector.get(poi.sectorId).push(poi);
    }
    const bonuses = [];
    for (const sector of state.data.sectors) {
      const sectorPois = poisBySector.get(sector.id) || [];
      if (!sectorPois.length) continue;
      const byFaction = new Map();
      let totalValue = 0;
      for (const poi of sectorPois) {
        const value = Number(poi.strategicValue || 0);
        byFaction.set(poi.factionId, (byFaction.get(poi.factionId) || 0) + value);
        totalValue += value;
      }
      if (!totalValue) continue;
      for (const [factionId, value] of byFaction) {
        if (value / totalValue >= Number(sector.threshold || 1)) {
          bonuses.push({ sectorId: sector.id, bodyId: sector.bodyId, factionId, value: Number(sector.bonusValue || 0) });
          break;
        }
      }
    }
    state.sectorBonusCache.set(cacheKey, bonuses);
    return bonuses;
  }

  function dominantFaction(scores) {
    let best = null;
    for (const faction of state.data.factions) {
      const value = scores[faction.id] || 0;
      if (!best || value > best.value) best = { id: faction.id, code: faction.code, value };
    }
    return best?.value ? best : null;
  }

  function factionBreakdownHtml(control) {
    if (!control.total) return `<p><strong>Control:</strong> No strategic value assigned yet.</p>`;
    const manualNote = control.manual ? `<p><strong>Control Source:</strong> Manual celestial-body override.</p>` : "";
    return `${manualNote}<div class="meta-grid">${state.data.factions.map(faction => {
      const value = Number(control.scores[faction.id] || 0);
      const pct = value / control.total * 100;
      const displayValue = Number.isInteger(value) ? value : Math.round(value * 100) / 100;
      return `<div class="meta-card"><strong style="color:${faction.color}">${escapeHtml(faction.code)}</strong>${formatPercent(pct)} / ${displayValue} pts</div>`;
    }).join("")}</div>`;
  }

  function renderSelectedPanel() {
    const poi = state.selectedPoiId ? state.data.pois.find(p => p.id === state.selectedPoiId) : null;
    if (poi && canSee(poi)) {
      const type = typeById(poi.type);
      const faction = factionById(poi.factionId);
      const body = bodyById(poi.bodyId);
      els.selectedTitle.textContent = poi.name;
      els.selectedInfo.innerHTML = `
        <p>${escapeHtml(poi.description || "No strategic paragraph entered for this POI yet.")}</p>
        <div class="meta-grid">
          <div class="meta-card"><strong>Type</strong>${escapeHtml(type.label)}</div>
          <div class="meta-card"><strong>Owner</strong><span style="color:${faction.color}">${escapeHtml(faction.name)}</span></div>
          <div class="meta-card"><strong>Theater</strong>${escapeHtml(body.name)}</div>
          <div class="meta-card"><strong>Tier</strong>${escapeHtml(tierLabel(poi.strategicTier || tierFromValue(Number(poi.strategicValue || 0))))}</div>
          <div class="meta-card"><strong>Value</strong>${Number(poi.strategicValue || 0)} strategic</div>
        </div>
        ${isAdmin() && poi.gmNotes ? `<p><strong>GM-Only Notes:</strong> ${escapeHtml(poi.gmNotes)}</p>` : ""}
      `;
      return;
    }

    const terrain = state.selectedTerrainId ? state.data.terrain.find(t => t.id === state.selectedTerrainId) : null;
    if (terrain) {
      const body = bodyById(terrain.bodyId);
      els.selectedTitle.textContent = terrain.name;
      els.selectedInfo.innerHTML = `
        <p>${escapeHtml(terrain.hazard || "No terrain note entered for this feature yet.")}</p>
        <div class="meta-grid">
          <div class="meta-card"><strong>Type</strong>${escapeHtml(titleCase(terrain.type))}</div>
          <div class="meta-card"><strong>Theater</strong>${escapeHtml(body?.name || "Unknown")}</div>
          <div class="meta-card"><strong>Span</strong>${Number(terrain.w || 0).toFixed(2)} × ${Number(terrain.h || 0).toFixed(2)}</div>
          <div class="meta-card"><strong>Density</strong>${Number(terrain.density || 0).toFixed(2)}</div>
        </div>
      `;
      return;
    }

    const body = bodyById(state.selectedBodyId);
    if (!body) return;
    const control = calculateBodyControl(body.id, currentIntelIsActual());
    els.selectedTitle.textContent = body.name;
    els.selectedInfo.innerHTML = `
      <p>${escapeHtml(body.description || "No briefing text entered for this body yet.")}</p>
      <div class="meta-grid">
        <div class="meta-card"><strong>Status</strong>${escapeHtml(body.statusLabel || titleCase(body.type))}</div>
        <div class="meta-card"><strong>Visible POIs</strong>${poisForBody(body.id, { visibleOnly: true }).length}</div>
        <div class="meta-card"><strong>Strategic Weight</strong>${Number(body.strategicWeight || 0)}</div>
        <div class="meta-card"><strong>Type</strong>${escapeHtml(titleCase(body.type))}</div>
      </div>
      ${factionBreakdownHtml(control)}
      ${bodyHasTheater(body) ? `<div class="panel-actions"><button class="primary-button" type="button" data-open-theater-body="${escapeHtml(body.id)}">Open Planet Theater</button></div>` : ""}
    `;
  }

  function renderPoiList() {
    if (!els.poiList) return;
    const body = bodyById(state.selectedBodyId);
    const visiblePois = state.data.pois
      .filter(poi => poi.bodyId === state.selectedBodyId && canSee(poi))
      .sort((a, b) => Number(b.strategicValue || 0) - Number(a.strategicValue || 0));
    if (!visiblePois.length) {
      els.poiList.innerHTML = `<p class="selected-info">No visible POIs for ${escapeHtml(body?.name || "this body")} yet.</p>`;
      return;
    }
    els.poiList.innerHTML = visiblePois.map(poi => {
      const type = typeById(poi.type);
      const faction = factionById(poi.factionId);
      const encrypted = poi.visibility === "hidden";
      return `
        <article class="poi-item">
          <button data-poi-id="${escapeHtml(poi.id)}">
            <div class="poi-item-title">
              <span>${escapeHtml(poi.name)}</span>
              <span style="color:${faction.color}">${escapeHtml(faction.code)}</span>
            </div>
            <p class="poi-snippet">${escapeHtml((poi.description || "No briefing paragraph entered yet.").slice(0, 150))}${poi.description?.length > 150 ? "…" : ""}</p>
            <div class="poi-tags">
              <span class="tag">${escapeHtml(type.label)}</span>
              <span class="tag">${escapeHtml(tierLabel(poi.strategicTier || tierFromValue(Number(poi.strategicValue || 0))))}</span>
              <span class="tag">${Number(poi.strategicValue || 0)} strategic</span>
              ${encrypted ? `<span class="tag">encrypted</span>` : ""}
            </div>
          </button>
        </article>
      `;
    }).join("");

    els.poiList.querySelectorAll("button[data-poi-id]").forEach(button => {
      button.addEventListener("click", () => {
        const poi = state.data.pois.find(p => p.id === button.dataset.poiId);
        if (!poi) return;
        state.selectedPoiId = poi.id;
        state.selectedBodyId = poi.bodyId;
        renderAllPanels();
      });
    });
  }

  function renderAdminLists() {
    els.factionList.innerHTML = state.data.factions.map((faction, index) => `
      <div class="record-item faction-record-item">
        <span style="display:flex;align-items:center;gap:8px;"><span class="record-swatch" style="color:${faction.color};background:${faction.color}"></span>${escapeHtml(faction.name)}</span>
        <div class="record-actions">
          <button class="mini-button" type="button" data-move-faction="${escapeHtml(faction.id)}" data-move-direction="-1" ${index === 0 ? "disabled" : ""} title="Move faction up">↑</button>
          <button class="mini-button" type="button" data-move-faction="${escapeHtml(faction.id)}" data-move-direction="1" ${index === state.data.factions.length - 1 ? "disabled" : ""} title="Move faction down">↓</button>
          <button class="ghost-button" type="button" data-edit-faction="${escapeHtml(faction.id)}">Edit</button>
        </div>
      </div>
    `).join("");

    els.factionList.querySelectorAll("button[data-edit-faction]").forEach(button => {
      button.addEventListener("click", () => {
        const faction = factionById(button.dataset.editFaction);
        els.factionId.value = faction.id;
        els.factionName.value = faction.name;
        els.factionCode.value = faction.code;
        els.factionColor.value = faction.color;
      });
    });

    els.factionList.querySelectorAll("button[data-move-faction]").forEach(button => {
      button.addEventListener("click", () => moveFaction(button.dataset.moveFaction, Number(button.dataset.moveDirection || 0)));
    });

    renderFactionMergeControls();
  }

  function renderFactionMergeControls() {
    if (!els.factionMergeSource || !els.factionMergeTarget || !els.mergeFactionBtn) return;
    const sourceBefore = els.factionMergeSource.value;
    const targetBefore = els.factionMergeTarget.value;
    const options = state.data.factions.map(faction => `<option value="${escapeHtml(faction.id)}">${escapeHtml(faction.name)}</option>`).join("");
    els.factionMergeSource.innerHTML = options;
    els.factionMergeTarget.innerHTML = options;
    const ids = state.data.factions.map(faction => faction.id);
    els.factionMergeSource.value = ids.includes(sourceBefore) ? sourceBefore : (ids[1] || ids[0] || "");
    els.factionMergeTarget.value = ids.includes(targetBefore) ? targetBefore : (ids.find(id => id !== els.factionMergeSource.value) || ids[0] || "");
    keepFactionMergeTargetsDistinct();
    els.mergeFactionBtn.disabled = !isAdmin() || state.data.factions.length < 2;
  }

  function keepFactionMergeTargetsDistinct(event) {
    if (!els.factionMergeSource || !els.factionMergeTarget) return;
    if (els.factionMergeSource.value !== els.factionMergeTarget.value) return;
    const alternative = state.data.factions.find(faction => faction.id !== (event?.target === els.factionMergeTarget ? els.factionMergeTarget.value : els.factionMergeSource.value));
    if (!alternative) return;
    if (event?.target === els.factionMergeTarget) els.factionMergeSource.value = alternative.id;
    else els.factionMergeTarget.value = alternative.id;
  }

  function moveFaction(factionId, direction) {
    if (!isAdmin()) return flashMessage("Faction ordering requires Admin or Root Mode.");
    const currentIndex = state.data.factions.findIndex(faction => faction.id === factionId);
    const nextIndex = currentIndex + Math.sign(direction);
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.data.factions.length) return;
    const [faction] = state.data.factions.splice(currentIndex, 1);
    state.data.factions.splice(nextIndex, 0, faction);
    saveData();
    populateStaticControls();
    renderAllPanels();
  }

  function mergeSelectedFaction() {
    if (!isAdmin()) return flashMessage("Faction merging requires Admin or Root Mode.");
    const sourceId = els.factionMergeSource?.value;
    const targetId = els.factionMergeTarget?.value;
    const source = state.data.factions.find(faction => faction.id === sourceId);
    const target = state.data.factions.find(faction => faction.id === targetId);
    if (!source || !target) return flashMessage("Choose both an absorbed faction and a receiving faction.");
    if (source.id === target.id) return flashMessage("A faction cannot be merged into itself.");
    if (state.data.factions.length < 2) return flashMessage("At least one faction must remain in the registry.");

    const poiCount = state.data.pois.filter(poi => poi.factionId === source.id).length;
    const overrideCount = state.data.bodies.filter(body => Number(body.controlOverride?.percentages?.[source.id] || 0) > 0).length;
    const confirmation = `Merge ${source.name} into ${target.name}?\n\nThis transfers ${poiCount} POI holding${poiCount === 1 ? "" : "s"} and ${overrideCount} celestial control override${overrideCount === 1 ? "" : "s"}, then permanently removes ${source.name} from the faction registry.`;
    if (!confirm(confirmation)) return;

    for (const poi of state.data.pois) {
      if (poi.factionId === source.id) poi.factionId = target.id;
    }
    for (const body of state.data.bodies) {
      const percentages = body.controlOverride?.percentages;
      if (!percentages || percentages[source.id] == null) continue;
      percentages[target.id] = Number(percentages[target.id] || 0) + Number(percentages[source.id] || 0);
      delete percentages[source.id];
    }

    state.data.factions = state.data.factions.filter(faction => faction.id !== source.id);
    state.data.meta ??= {};
    state.data.meta.deletedFactionIds = [...new Set([...(state.data.meta.deletedFactionIds || []), source.id])];
    if (els.factionId.value === source.id) {
      els.factionForm.reset();
      els.factionId.value = "";
      els.factionColor.value = "#58a6ff";
    }
    saveData();
    populateStaticControls();
    renderAllPanels();
    flashMessage(`${source.name} was merged into ${target.name}. All mapped holdings now belong to ${target.name}.`);
  }

  function renderAdminAccessState() {
    const adminAllowed = isAdmin();
    const rootAllowed = isRoot();
    const adminInputs = [
      ...els.factionForm.querySelectorAll("input, button"),
      ...(els.factionMergeSource ? [els.factionMergeSource] : []),
      ...(els.factionMergeTarget ? [els.factionMergeTarget] : []),
      ...(els.mergeFactionBtn ? [els.mergeFactionBtn] : []),
      ...els.moonForm.querySelectorAll("input, select, button"),
      ...(els.bodyForm ? els.bodyForm.querySelectorAll("input, select, button") : [])
    ];
    adminInputs.forEach(input => {
      input.disabled = !adminAllowed;
      input.title = adminAllowed ? "" : "Requires Admin or Root Mode.";
    });
    if (els.mergeFactionBtn) els.mergeFactionBtn.disabled = !adminAllowed || state.data.factions.length < 2;
    const selectedEditorBody = bodyById(els.bodyEditSelect?.value);
    if (els.bodyEditName) {
      const lockedName = bodyNameIsProtected(selectedEditorBody);
      els.bodyEditName.readOnly = lockedName;
      els.bodyEditName.title = lockedName
        ? "Primary planet, Waystation, star, and Rantel Cluster names are permanently locked."
        : (adminAllowed ? "" : "Requires Admin or Root Mode.");
    }
    updateBodyDeleteState();

    const poiInputs = [...els.poiForm.querySelectorAll("input, select, textarea, button")];
    poiInputs.forEach(input => {
      input.disabled = !adminAllowed;
      input.title = adminAllowed ? "" : "Requires Admin or Root Mode.";
    });

    if (els.dataToolsCard) els.dataToolsCard.classList.toggle("hidden", !rootAllowed);
    [els.exportDataBtn, els.importDataInput, els.resetDataBtn].forEach(input => {
      if (!input) return;
      input.disabled = !rootAllowed;
      input.title = rootAllowed ? "" : "Requires Root Mode.";
    });

    if (els.passwordToolsCard) els.passwordToolsCard.classList.toggle("hidden", !rootAllowed);
    els.passwordForm?.querySelectorAll("input, button").forEach(input => {
      input.disabled = !rootAllowed;
      input.title = rootAllowed ? "" : "Requires Root Mode.";
    });
  }

  function tierFromValue(value) {
    const numeric = Number(value || 0);
    let best = STRATEGIC_TIERS[0];
    for (const tier of STRATEGIC_TIERS) {
      if (numeric >= tier.value) best = tier;
    }
    return best.id;
  }

  function tierLabel(id) {
    return STRATEGIC_TIERS.find(t => t.id === id)?.label || "Unrated";
  }

  function applyTierToInput(select, input) {
    if (!select || !input) return;
    const tier = STRATEGIC_TIERS.find(t => t.id === select.value);
    if (tier) input.value = tier.value;
  }

  function updatePoiFormMode() {
    if (!els.poiType) return;
    const custom = poiUsesCustomColor(els.poiType.value);
    els.poiOwnerLabel?.classList.toggle("hidden", custom);
    els.poiColorLabel?.classList.toggle("hidden", !custom);
    els.poiStrategicValueLabel?.classList.toggle("hidden", custom);
    if (custom) {
      if (els.poiStrategic) els.poiStrategic.value = "0";
      if (els.poiColor && !els.poiColor.value) els.poiColor.value = "#c7d2e0";
    }
  }

  function updateQuickPoiFormMode() {
    if (!els.quickPoiType) return;
    const custom = poiUsesCustomColor(els.quickPoiType.value);
    els.quickPoiOwnerLabel?.classList.toggle("hidden", custom);
    els.quickPoiColorLabel?.classList.toggle("hidden", !custom);
    els.quickPoiStrategicValueLabel?.classList.toggle("hidden", custom);
    if (custom) {
      if (els.quickPoiStrategic) els.quickPoiStrategic.value = "0";
      if (els.quickPoiColor && !els.quickPoiColor.value) els.quickPoiColor.value = "#c7d2e0";
    }
  }

  function updateIconPreview(select, preview, ownerSelect = null, colorInput = null, typeSelect = null) {
    if (!select || !preview) return;
    const icon = templateById(select.value);
    const useCustom = typeSelect ? poiUsesCustomColor(typeSelect.value) : false;
    const color = useCustom ? (colorInput?.value || "#c7d2e0") : (ownerSelect ? factionById(ownerSelect.value)?.color : "#6df7ff");
    preview.title = icon?.label || "POI icon";
    preview.className = "icon-preview";
    renderIconChip(preview, icon?.id || defaultIconForType("tactical"), color || "#6df7ff", 28);
  }

  function hideQuickPoiMenu() {
    els.quickPoiMenu?.classList.add("hidden");
    if (els.quickPoiMenu) els.quickPoiMenu.innerHTML = "";
  }

  function showQuickPoiMenu(clientX, clientY, poi) {
    if (!els.quickPoiMenu) return;
    els.quickPoiMenu.innerHTML = `
      <button type="button" data-action="quick-edit">Quick Edit</button>
      <button type="button" data-action="full-edit">Full Edit in Admin Panel</button>
      <button type="button" data-action="delete" class="danger-menu-item">Delete POI</button>
    `;
    els.quickPoiMenu.style.left = `${clientX}px`;
    els.quickPoiMenu.style.top = `${clientY}px`;
    els.quickPoiMenu.classList.remove("hidden");
    els.quickPoiMenu.querySelector('[data-action="quick-edit"]').addEventListener("click", () => {
      hideQuickPoiMenu();
      showQuickPoiEditor({ mode: "edit", poi });
    });
    els.quickPoiMenu.querySelector('[data-action="full-edit"]').addEventListener("click", () => {
      hideQuickPoiMenu();
      loadPoiIntoForm(poi);
      state.selectedPoiId = poi.id;
      state.selectedBodyId = poi.bodyId;
      setView("admin");
    });
    els.quickPoiMenu.querySelector('[data-action="delete"]').addEventListener("click", () => {
      hideQuickPoiMenu();
      if (!confirm(`Delete ${poi.name}?`)) return;
      state.data.pois = state.data.pois.filter(p => p.id !== poi.id);
      state.selectedPoiId = null;
      saveData();
      state.planetDirty = true;
      renderAllPanels();
    });
  }

  function showQuickPoiEditor(options) {
    if (!els.quickPoiEditor || !(isAdmin() || (state.role === "command" && (options.mode || "create") === "create"))) return;
    hideQuickPoiMenu();
    const poi = options.poi || null;
    const mode = options.mode || (poi ? "edit" : "create");
    const bodyId = poi?.bodyId || options.bodyId || state.selectedBodyId;
    const x = poi?.x ?? options.x ?? .5;
    const y = poi?.y ?? options.y ?? .5;
    els.quickPoiEyebrow.textContent = mode === "edit" ? "Quick Edit" : "Quick Create";
    els.quickPoiTitle.textContent = mode === "edit" ? "Edit POI" : `Create POI on ${bodyById(bodyId)?.name || "Selected Body"}`;
    els.quickPoiId.value = poi?.id || "";
    els.quickPoiBody.value = bodyId;
    els.quickPoiX.value = Number(x).toFixed(4);
    els.quickPoiY.value = Number(y).toFixed(4);
    els.quickPoiName.value = poi?.name || "New Point of Interest";
    els.quickPoiType.value = options.forceType || (state.role === "command" && !isAdmin() ? "tactical" : normalizePoiTypeId(poi?.type || "tactical"));
    refreshIconSelect(els.quickPoiIcon, els.quickPoiType.value, poi?.modelTemplateId || defaultIconForType(els.quickPoiType.value));
    els.quickPoiOwner.value = poi?.factionId || state.data.factions[0]?.id || "";
    if (els.quickPoiColor) els.quickPoiColor.value = poi?.color || "#c7d2e0";
    els.quickPoiVisibility.value = poi?.visibility || "public";
    els.quickPoiStrategicTier.value = poi?.strategicTier || tierFromValue(Number(poi?.strategicValue ?? 1));
    els.quickPoiStrategic.value = Number(poi?.strategicValue ?? STRATEGIC_TIERS.find(t => t.id === els.quickPoiStrategicTier.value)?.value ?? 1);
    els.quickPoiTactical.value = Number(poi?.tacticalValue || 0);
    els.quickPoiDisplaySize.value = Number(poi?.displaySize || defaultPoiDisplaySize(els.quickPoiType.value, els.quickPoiStrategicTier.value, poi?.modelTemplateId || els.quickPoiIcon.value)).toFixed(2);
    els.quickPoiTextSize.value = Number(poi?.textSize ?? 1).toFixed(2);
    els.quickPoiDescription.value = poi?.description || "";
    updateQuickPoiFormMode();
    updateIconPreview(els.quickPoiIcon, els.quickPoiIconPreview, els.quickPoiOwner, els.quickPoiColor, els.quickPoiType);
    els.quickPoiType.disabled = state.role === "command" && !isAdmin();
    els.quickPoiFullEditBtn.style.display = isAdmin() ? "inline-flex" : "none";
    els.quickPoiDeleteBtn.style.display = mode === "edit" && isAdmin() ? "inline-flex" : "none";
    els.quickPoiEditor.classList.remove("hidden");
  }

  function hideQuickPoiEditor() {
    els.quickPoiEditor?.classList.add("hidden");
  }

  function defaultIconForType(typeId) {
    return templatesForType(typeId)[0]?.id || state.data.modelTemplates[0]?.id || "exploration-star";
  }

  function quickPoiPayload() {
    const typeId = els.quickPoiType.value;
    return {
      id: els.quickPoiId.value || uuid("poi"),
      bodyId: els.quickPoiBody.value || state.selectedBodyId,
      name: els.quickPoiName.value.trim(),
      type: typeId,
      subtype: "",
      modelTemplateId: els.quickPoiIcon.value || defaultIconForType(typeId),
      strategicTier: els.quickPoiStrategicTier.value || tierFromValue(Number(els.quickPoiStrategic.value || 0)),
      factionId: poiUsesCustomColor(typeId) ? "neutral" : els.quickPoiOwner.value,
      color: poiUsesCustomColor(typeId) ? (els.quickPoiColor?.value || "#c7d2e0") : "",
      visibility: state.role === "command" && !isAdmin() ? "public" : els.quickPoiVisibility.value,
      strategicValue: poiUsesCustomColor(typeId) ? 0 : clamp(Number(els.quickPoiStrategic.value || 0), 0, 100),
      tacticalValue: Number(els.quickPoiTactical.value || 0),
      displaySize: clamp(Number(els.quickPoiDisplaySize.value || defaultPoiDisplaySize(typeId, els.quickPoiStrategicTier.value, els.quickPoiIcon.value)), 0.25, 3),
      textSize: clamp(Number(els.quickPoiTextSize.value || 1), 0.5, 3),
      sectorId: null,
      x: clamp(Number(els.quickPoiX.value || .5), 0, 1),
      y: clamp(Number(els.quickPoiY.value || .5), 0, 1),
      description: els.quickPoiDescription.value.trim(),
      gmNotes: ""
    };
  }

  function onQuickPoiSubmit(event) {
    event.preventDefault();
    if (!(isAdmin() || (state.role === "command" && els.quickPoiType.value === "tactical" && !els.quickPoiId.value))) return flashMessage("Command Mode can quick-create Tactical Points only.");
    const payload = quickPoiPayload();
    if (!payload.name) return flashMessage("POI name is required.");
    const existing = state.data.pois.find(p => p.id === payload.id);
    if (existing) Object.assign(existing, payload);
    else state.data.pois.push(payload);
    state.selectedBodyId = payload.bodyId;
    state.selectedPoiId = payload.id;
    saveData();
    state.planetDirty = true;
    hideQuickPoiEditor();
    renderAllPanels();
  }

  function openQuickPoiFullEdit() {
    if (!isAdmin()) return;
    const payload = quickPoiPayload();
    const existing = state.data.pois.find(p => p.id === payload.id);
    if (existing) Object.assign(existing, payload);
    else state.data.pois.push(payload);
    saveData();
    state.selectedBodyId = payload.bodyId;
    state.selectedPoiId = payload.id;
    loadPoiIntoForm(payload);
    hideQuickPoiEditor();
    setView("admin");
  }

  function deleteQuickPoi() {
    if (!isAdmin()) return;
    const id = els.quickPoiId.value;
    if (!id) return hideQuickPoiEditor();
    const poi = state.data.pois.find(p => p.id === id);
    if (!poi) return hideQuickPoiEditor();
    if (!confirm(`Delete ${poi.name}?`)) return;
    state.data.pois = state.data.pois.filter(p => p.id !== id);
    state.selectedPoiId = null;
    saveData();
    state.planetDirty = true;
    hideQuickPoiEditor();
    renderAllPanels();
  }

  function clearPoiForm() {
    els.poiId.value = "";
    els.poiName.value = "";
    els.poiBody.value = state.selectedBodyId;
    els.poiType.value = "tactical";
    els.poiSubtype.value = "OP";
    refreshIconSelect(els.poiModel, "tactical", defaultIconForType("tactical"));
    els.poiStrategicTier.value = "minor";
    applyTierToInput(els.poiStrategicTier, els.poiStrategic);
    els.poiOwner.value = state.data.factions[0]?.id || "gar";
    if (els.poiColor) els.poiColor.value = "#c7d2e0";
    els.poiVisibility.value = "public";
    els.poiTactical.value = "1";
    els.poiDisplaySize.value = String(defaultPoiDisplaySize("tactical", "minor", defaultIconForType("tactical")));
    els.poiTextSize.value = "1";
    els.poiX.value = state.planetPlacement?.x?.toFixed(3) || "0.5";
    els.poiY.value = state.planetPlacement?.y?.toFixed(3) || "0.5";
    els.poiDescription.value = "";
    els.poiGmNotes.value = "";
    updatePoiFormMode();
    updateIconPreview(els.poiModel, els.poiIconPreview, els.poiOwner, els.poiColor, els.poiType);
  }

  function onFactionSubmit(event) {
    event.preventDefault();
    if (!isAdmin()) return flashMessage("Faction editing requires Web Admin role.");
    const name = els.factionName.value.trim();
    const code = els.factionCode.value.trim() || slugify(name).slice(0, 5).toUpperCase();
    if (!name) return flashMessage("Faction name is required.");
    const id = els.factionId.value || slugify(code || name);
    const existing = state.data.factions.find(f => f.id === id);
    state.data.meta ??= {};
    state.data.meta.deletedFactionIds = (state.data.meta.deletedFactionIds || []).filter(deletedId => deletedId !== id);
    const payload = { id, code, name, color: els.factionColor.value, description: existing?.description || "" };
    if (existing) Object.assign(existing, payload);
    else state.data.factions.push(payload);
    saveData();
    populateStaticControls();
    renderAllPanels();
    els.factionForm.reset();
    els.factionColor.value = "#58a6ff";
  }

  function onPoiSubmit(event) {
    event.preventDefault();
    if (!isStaff()) return flashMessage("POI editing requires staff role.");

    const typeId = els.poiType.value;
    if (!canCreatePoiType(typeId)) return flashMessage(tacticalRoleRestrictionMessage());

    const strategicValue = Number(els.poiStrategic.value || 0);
    const payload = {
      id: els.poiId.value || uuid("poi"),
      bodyId: els.poiBody.value,
      name: els.poiName.value.trim(),
      type: typeId,
      subtype: els.poiSubtype.value.trim(),
      modelTemplateId: els.poiModel.value,
      strategicTier: els.poiStrategicTier.value || tierFromValue(strategicValue),
      factionId: poiUsesCustomColor(typeId) ? "neutral" : els.poiOwner.value,
      color: poiUsesCustomColor(typeId) ? (els.poiColor?.value || "#c7d2e0") : "",
      visibility: els.poiVisibility.value,
      strategicValue: poiUsesCustomColor(typeId) ? 0 : clamp(strategicValue, 0, state.role === "pseudo" ? 1 : 100),
      tacticalValue: Number(els.poiTactical.value || 0),
      displaySize: clamp(Number(els.poiDisplaySize.value || defaultPoiDisplaySize(typeId, els.poiStrategicTier.value, els.poiModel.value)), 0.25, 3),
      textSize: clamp(Number(els.poiTextSize.value || 1), 0.5, 3),
      sectorId: null,
      x: clamp(Number(els.poiX.value || .5), 0, 1),
      y: clamp(Number(els.poiY.value || .5), 0, 1),
      description: els.poiDescription.value.trim(),
      gmNotes: els.poiGmNotes.value.trim()
    };

    if (!payload.name) return flashMessage("POI name is required.");

    if (state.role === "pseudo" && ["hidden", "gm", "faction"].includes(payload.visibility)) {
      payload.visibility = "public";
      flashMessage("Command-mode POIs are disabled. Hidden assets require Admin or Root Mode.");
    }

    const existing = state.data.pois.find(p => p.id === payload.id);
    if (existing && !canEditPoi(existing)) return flashMessage(tacticalRoleRestrictionMessage());
    if (existing) Object.assign(existing, payload);
    else state.data.pois.push(payload);

    state.selectedBodyId = payload.bodyId;
    state.selectedPoiId = payload.id;
    saveData();
    state.planetDirty = true;
    renderAllPanels();
  }

  function onDeletePoi() {
    if (!isStaff()) return flashMessage("Deleting POIs requires staff role.");
    const id = els.poiId.value;
    if (!id) return flashMessage("Load a POI into the editor before deleting.");
    const poi = state.data.pois.find(p => p.id === id);
    if (!poi) return;
    if (!canEditPoi(poi)) return flashMessage(tacticalRoleRestrictionMessage());
    if (!confirm(`Delete ${poi.name}?`)) return;
    state.data.pois = state.data.pois.filter(p => p.id !== id);
    state.selectedPoiId = null;
    saveData();
    clearPoiForm();
    renderAllPanels();
  }

  async function onMoonSubmit(event) {
    event.preventDefault();
    if (!isAdmin()) return flashMessage("Adding moons requires Admin or Root Mode.");
    const name = els.moonName.value.trim();
    if (!name) return flashMessage("Moon name is required.");
    const parent = bodyById(els.moonParent.value);
    if (!parent) return flashMessage("Choose a parent planet first.");

    const moonId = slugify(name) || uuid("moon");
    const textureFile = els.moonTexture?.files?.[0] || null;
    let textureDataUrl = null;
    let textureUrl = null;
    let texturePath = null;
    if (textureFile) {
      try {
        ({ textureDataUrl, textureUrl, texturePath } = await uploadOrEmbedBodyTexture(textureFile, moonId));
      } catch (err) {
        return flashMessage(err.message || String(err));
      }
    }

    state.data.meta ??= {};
    state.data.meta.deletedBodyIds = (state.data.meta.deletedBodyIds || []).filter(id => id !== moonId);

    const newMoon = {
      id: moonId,
      type: "moon",
      parentBodyId: parent.id,
      name,
      template: "custom",
      description: "Custom moon theater. Add a briefing paragraph in the Celestial Bodies Editor.",
      colorA: "#6f8795",
      colorB: "#d7e5ee",
      radius: 12,
      moonOrbitRadius: Number(els.moonOrbit.value || 26),
      moonOrbitSpeed: 0.00006 + Math.random() * 0.00004,
      moonOrbitOffset: Math.random() * Math.PI * 2,
      strategicWeight: Number(els.moonWeight.value || 6),
      textureUrl,
      texturePath,
      textureDataUrl
    };

    state.data.bodies.push(newMoon);
    const textureSource = customTextureSource(newMoon);
    if (textureSource) cacheBodyTexture(newMoon, textureSource, { showError: true });
    saveData();
    state.selectedBodyId = newMoon.id;
    renderAllPanels();
    els.moonForm.reset();
  }

  function bodyCanBeDeleted(body) {
    return Boolean(body && body.parentBodyId);
  }

  function descendantBodyIds(rootBodyId) {
    const ids = new Set([rootBodyId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const body of state.data.bodies) {
        if (body.parentBodyId && ids.has(body.parentBodyId) && !ids.has(body.id)) {
          ids.add(body.id);
          changed = true;
        }
      }
    }
    return ids;
  }

  function updateBodyDeleteState(body = bodyById(els.bodyEditSelect?.value)) {
    if (!els.deleteBodyBtn) return;
    const deletable = bodyCanBeDeleted(body);
    els.deleteBodyBtn.disabled = !isAdmin() || !deletable;
    els.deleteBodyBtn.title = !isAdmin()
      ? "Requires Admin or Root Mode."
      : deletable
        ? `Delete ${body.name} and its attached data.`
        : "Core planets, the asteroid belt, and other primary system bodies are protected.";
    if (els.deleteBodyNote) {
      els.deleteBodyNote.textContent = deletable
        ? `${body.name} is linked to ${bodyById(body.parentBodyId)?.name || "another system body"} and can be deleted. Associated POIs, terrain, child satellites, and cached textures will also be removed.`
        : "Core system bodies are protected. Select a linked moon, station, or satellite to delete it and its attached campaign data.";
    }
  }

  function onDeleteBody() {
    if (!isAdmin()) return flashMessage("Deleting celestial bodies requires Admin or Root Mode.");
    const body = bodyById(els.bodyEditSelect?.value);
    if (!body) return flashMessage("Select a linked moon, Waystation, or satellite to delete.");
    if (!bodyCanBeDeleted(body)) {
      return flashMessage("Core system bodies are protected and cannot be deleted.");
    }

    const removedIds = descendantBodyIds(body.id);
    const removedBodies = state.data.bodies.filter(item => removedIds.has(item.id));
    const poiCount = state.data.pois.filter(item => removedIds.has(item.bodyId)).length;
    const terrainCount = state.data.terrain.filter(item => removedIds.has(item.bodyId)).length;
    const sectorCount = (state.data.sectors || []).filter(item => removedIds.has(item.bodyId)).length;
    const childCount = Math.max(0, removedBodies.length - 1);
    const parent = bodyById(body.parentBodyId);

    const details = [
      childCount ? `${childCount} child satellite${childCount === 1 ? "" : "s"}` : "",
      poiCount ? `${poiCount} POI${poiCount === 1 ? "" : "s"}` : "",
      terrainCount ? `${terrainCount} terrain feature${terrainCount === 1 ? "" : "s"}` : "",
      sectorCount ? `${sectorCount} sector${sectorCount === 1 ? "" : "s"}` : ""
    ].filter(Boolean);

    const warning = details.length
      ? ` This will also remove ${details.join(", ")}.`
      : "";

    if (!confirm(`Delete ${body.name}?${warning} This cannot be undone unless you restore an exported JSON backup.`)) return;

    state.data.meta ??= {};
    const deletedBodyIds = new Set(state.data.meta.deletedBodyIds || []);
    for (const removedId of removedIds) deletedBodyIds.add(removedId);
    state.data.meta.deletedBodyIds = [...deletedBodyIds];

    state.data.bodies = state.data.bodies.filter(item => !removedIds.has(item.id));
    state.data.pois = state.data.pois.filter(item => !removedIds.has(item.bodyId));
    state.data.terrain = state.data.terrain.filter(item => !removedIds.has(item.bodyId));
    state.data.sectors = (state.data.sectors || []).filter(item => !removedIds.has(item.bodyId));

    const removedTexturePaths = removedBodies.map(item => item.texturePath).filter(Boolean);
    if (removedTexturePaths.length) {
      window.CC_LOGISTICS?.deleteAtlasTextures?.(removedTexturePaths);
    }
    for (const removedId of removedIds) {
      delete state.textures[removedId];
      delete state.textureCanvases[removedId];
      delete state.systemTextureCanvases[removedId];
      state.bodyPositions.delete(removedId);
    }

    if (state.selectedPoiId && !state.data.pois.some(item => item.id === state.selectedPoiId)) {
      state.selectedPoiId = null;
    }
    if (state.selectedTerrainId && !state.data.terrain.some(item => item.id === state.selectedTerrainId)) {
      state.selectedTerrainId = null;
    }

    const fallback = parent && state.data.bodies.some(item => item.id === parent.id)
      ? parent
      : firstTheaterBody() || state.data.bodies[0];

    state.selectedBodyId = fallback?.id || "";
    state.planetPlacement = null;
    state.planetDirty = true;
    saveData();
    renderAllPanels();

    if (els.bodyEditSelect?.value) {
      loadBodyIntoForm(els.bodyEditSelect.value);
    }
    flashMessage(`Deleted ${body.name}${childCount ? ` and ${childCount} linked child satellite${childCount === 1 ? "" : "s"}` : ""}.`);
  }

  function bodySupportsControlOverride(body) {
    return Boolean(body && body.id);
  }

  function manualBodyControl(body) {
    if (!bodySupportsControlOverride(body) || body.controlOverride?.enabled !== true) return null;
    const scores = Object.fromEntries(state.data.factions.map(faction => [faction.id, 0]));
    const weight = Math.max(0, Number(body.strategicWeight || 0));
    const percentages = body.controlOverride?.percentages || {};
    let percentTotal = 0;
    for (const faction of state.data.factions) {
      const pct = clamp(Number(percentages[faction.id] || 0), 0, 100);
      percentTotal += pct;
      scores[faction.id] = weight * pct / 100;
    }
    if (Math.abs(percentTotal - 100) > 0.05) return null;
    return { scores, total: weight, manual: true };
  }

  function bodyControlOverrideValuesFromForm() {
    const percentages = {};
    let total = 0;
    els.bodyEditControlFields?.querySelectorAll("[data-body-control-faction]").forEach(input => {
      const value = clamp(Number(input.value || 0), 0, 100);
      percentages[input.dataset.bodyControlFaction] = value;
      total += value;
    });
    return { percentages, total };
  }

  function updateBodyControlOverrideTotal() {
    if (!els.bodyEditControlTotal) return;
    const { total } = bodyControlOverrideValuesFromForm();
    const rounded = Math.round(total * 10) / 10;
    const enabled = Boolean(els.bodyEditControlOverride?.checked);
    if (!enabled) {
      els.bodyEditControlTotal.textContent = `Override disabled · saved allocation total: ${rounded}%`;
      els.bodyEditControlTotal.classList.remove("valid", "invalid");
      return;
    }
    els.bodyEditControlTotal.textContent = `Total: ${rounded}%${Math.abs(total - 100) <= 0.05 ? " ✓" : " — must equal 100%"}`;
    els.bodyEditControlTotal.classList.toggle("valid", Math.abs(total - 100) <= 0.05);
    els.bodyEditControlTotal.classList.toggle("invalid", Math.abs(total - 100) > 0.05);
  }

  function updateBodyControlOverrideAvailability() {
    const enabled = Boolean(els.bodyEditControlOverride?.checked);
    els.bodyEditControlFields?.querySelectorAll("input").forEach(input => { input.disabled = !enabled; });
    els.bodyEditControlFields?.classList.toggle("disabled", !enabled);
    updateBodyControlOverrideTotal();
  }

  function renderBodyControlOverrideEditor(body) {
    if (!els.bodyEditControlOverrideSection || !els.bodyEditControlFields || !els.bodyEditControlOverride) return;
    const eligible = bodySupportsControlOverride(body);
    els.bodyEditControlOverrideSection.classList.toggle("hidden", !eligible);
    if (!eligible) {
      els.bodyEditControlOverride.checked = false;
      els.bodyEditControlFields.innerHTML = "";
      if (els.bodyEditControlTotal) els.bodyEditControlTotal.textContent = "Total: 0%";
      return;
    }

    const percentages = body.controlOverride?.percentages || {};
    els.bodyEditControlOverride.checked = body.controlOverride?.enabled === true;
    els.bodyEditControlFields.innerHTML = state.data.factions.map(faction => `
      <label class="body-control-faction-row">
        <span><i style="background:${faction.color}"></i>${escapeHtml(faction.name)}</span>
        <span class="body-control-percent-input"><input type="number" min="0" max="100" step="0.1" value="${Number(percentages[faction.id] || 0)}" data-body-control-faction="${escapeHtml(faction.id)}" />%</span>
      </label>
    `).join("");
    updateBodyControlOverrideAvailability();
  }

  function bodySupportsTextureEditing(body) {
    return Boolean(body && body.type === "moon");
  }

  function renderBodyTextureEditor(body) {
    if (!els.bodyEditTextureSection || !els.bodyEditTexture) return;
    const eligible = bodySupportsTextureEditing(body);
    els.bodyEditTextureSection.classList.toggle("hidden", !eligible);
    els.bodyEditTexture.disabled = !eligible;
    els.bodyEditTexture.value = "";
    if (!eligible) {
      if (els.bodyEditTexturePreview) {
        els.bodyEditTexturePreview.removeAttribute("src");
        els.bodyEditTexturePreview.classList.add("hidden");
      }
      return;
    }

    const source = customTextureSource(body);
    if (els.bodyEditTextureStatus) {
      els.bodyEditTextureStatus.textContent = body.textureUrl
        ? "A shared Supabase texture is currently assigned. Choose a new 2:1 image to replace it."
        : body.textureDataUrl
          ? "A local-only texture is currently assigned. Choose a new image, or save while signed in as Admin/Root to publish it."
          : "No custom texture is assigned. The moon is using its procedural/template fallback.";
    }
    if (els.bodyEditTexturePreview) {
      if (source) {
        els.bodyEditTexturePreview.src = source;
        els.bodyEditTexturePreview.classList.remove("hidden");
      } else {
        els.bodyEditTexturePreview.removeAttribute("src");
        els.bodyEditTexturePreview.classList.add("hidden");
      }
    }
  }

  function bodySupportsAsteroidDensity(body) {
    return Boolean(body && body.id === "rantel-cluster");
  }

  function updateAsteroidDensityReadout() {
    if (!els.bodyEditAsteroidDensity || !els.bodyEditAsteroidDensityValue) return;
    const count = clamp(Math.round(Number(els.bodyEditAsteroidDensity.value || 340)), 100, 1200);
    els.bodyEditAsteroidDensityValue.textContent = `${count} asteroid${count === 1 ? "" : "s"}`;
  }

  function renderAsteroidDensityEditor(body) {
    if (!els.bodyEditAsteroidDensitySection || !els.bodyEditAsteroidDensity) return;
    const eligible = bodySupportsAsteroidDensity(body);
    els.bodyEditAsteroidDensitySection.classList.toggle("hidden", !eligible);
    els.bodyEditAsteroidDensity.disabled = !eligible;
    if (!eligible) return;
    els.bodyEditAsteroidDensity.value = String(clamp(Math.round(Number(body.asteroidVisualCount ?? 340)), 100, 1200));
    updateAsteroidDensityReadout();
  }

  function bodyUsesPrimarySystemOrbit(body) {
    return Boolean(body && (
      !body.parentBodyId
      || (body.type === "station" && body.parentBodyId === "rantel-cluster")
    ));
  }

  function loadBodyIntoForm(bodyId) {
    if (!els.bodyForm) return;
    const body = bodyById(bodyId) || bodyById(state.selectedBodyId) || bodiesForBodyEditor()[0];
    if (!body) return;
    els.bodyEditSelect.value = body.id;
    els.bodyEditName.value = canonicalProtectedBodyName(body);
    els.bodyEditName.readOnly = bodyNameIsProtected(body);
    els.bodyEditName.title = bodyNameIsProtected(body)
      ? "Primary planet, Waystation, star, and Rantel Cluster names are permanently locked."
      : "";
    els.bodyEditRadius.max = body.type === "star" ? "240" : "120";
    els.bodyEditRadius.value = Number(body.radius || 10);
    const isSystemStar = body.type === "star";
    const usesPrimaryOrbit = bodyUsesPrimarySystemOrbit(body);
    const orbitRadius = usesPrimaryOrbit
      ? (body.orbitRadius || 100)
      : (body.moonOrbitRadius || body.satelliteOrbitRadius || body.orbitRadius || 56);
    const orbitSpeed = usesPrimaryOrbit
      ? (body.orbitSpeed || 0.00002)
      : (body.moonOrbitSpeed || body.satelliteOrbitSpeed || body.orbitSpeed || 0.00006);
    els.bodyEditOrbitRadius.disabled = isSystemStar;
    els.bodyEditOrbitSpeed.disabled = isSystemStar;
    els.bodyEditOrbitRadius.title = isSystemStar ? "Osiris is fixed at the center of the system." : "";
    els.bodyEditOrbitSpeed.title = isSystemStar ? "Osiris is fixed at the center of the system." : "";
    els.bodyEditOrbitRadius.value = isSystemStar ? 0 : Number(orbitRadius);
    els.bodyEditOrbitSpeed.value = isSystemStar ? 0 : Number(orbitSpeed);
    els.bodyEditWeight.value = Number(body.strategicWeight || 0);
    renderAsteroidDensityEditor(body);
    renderBodyTextureEditor(body);
    if (els.bodyEditDescription) els.bodyEditDescription.value = body.description || "";
    els.bodyEditStatus.value = body.statusLabel || "";
    renderBodyControlOverrideEditor(body);
    const lore = normalizeBodyLore(body.lore || {});
    const sats = satellitesForBody(body.id).map(sat => sat.name).join(", ") || "None registered";
    if (els.bodyEditSatellites) els.bodyEditSatellites.textContent = sats;
    if (els.bodyEditDiameter) els.bodyEditDiameter.value = lore.diameter;
    if (els.bodyEditAtmosphere) els.bodyEditAtmosphere.value = lore.atmosphere;
    if (els.bodyEditRotationPeriod) els.bodyEditRotationPeriod.value = lore.rotationPeriod;
    if (els.bodyEditOrbitalPeriod) els.bodyEditOrbitalPeriod.value = lore.orbitalPeriod;
    if (els.bodyEditClimate) els.bodyEditClimate.value = listToEditorValue(lore.climate);
    if (els.bodyEditTerrain) els.bodyEditTerrain.value = listToEditorValue(lore.terrain);
    if (els.bodyEditNativeSpecies) els.bodyEditNativeSpecies.value = listToEditorValue(lore.nativeSpecies);
    if (els.bodyEditLanguages) els.bodyEditLanguages.value = listToEditorValue(lore.languages);
    if (els.bodyEditGovernment) els.bodyEditGovernment.value = listToEditorValue(lore.government);
    if (els.bodyEditPopulation) els.bodyEditPopulation.value = lore.population;
    if (els.bodyEditMajorImports) els.bodyEditMajorImports.value = lore.majorImports;
    if (els.bodyEditMajorExports) els.bodyEditMajorExports.value = lore.majorExports;
    updateBodyDeleteState(body);
  }

  async function onBodySubmit(event) {
    event.preventDefault();
    if (!isAdmin()) return flashMessage("Celestial body editing requires Admin or Root Mode.");
    const body = bodyById(els.bodyEditSelect.value);
    if (!body) return flashMessage("Select a celestial body to edit.");
    if (bodyNameIsProtected(body)) {
      body.name = canonicalProtectedBodyName(body);
      body.shortName = seed.bodies?.find(item => item.id === body.id)?.shortName || body.name;
    } else {
      body.name = els.bodyEditName.value.trim() || body.name;
      body.shortName = body.shortName || body.name;
    }
    const maximumRadius = body.type === "star" ? 240 : 120;
    body.radius = clamp(Number(els.bodyEditRadius.value || body.radius || 10), 1, maximumRadius);
    if (body.type !== "star") {
      const orbitRadius = Math.max(1, Number(els.bodyEditOrbitRadius.value || 1));
      const orbitSpeed = Math.max(0, Number(els.bodyEditOrbitSpeed.value || 0));
      if (bodyUsesPrimarySystemOrbit(body)) {
        body.orbitRadius = orbitRadius;
        body.orbitSpeed = orbitSpeed;
        // Remove stale satellite-orbit overrides created by older builds.
        delete body.moonOrbitRadius;
        delete body.moonOrbitSpeed;
      } else {
        body.moonOrbitRadius = orbitRadius;
        body.moonOrbitSpeed = orbitSpeed;
      }
    }
    body.strategicWeight = Math.max(0, Number(els.bodyEditWeight.value || 0));
    if (bodySupportsAsteroidDensity(body)) {
      body.asteroidVisualCount = clamp(Math.round(Number(els.bodyEditAsteroidDensity?.value || 340)), 100, 1200);
    }
    body.description = els.bodyEditDescription?.value.trim() || "";
    body.statusLabel = els.bodyEditStatus.value.trim();

    if (bodySupportsControlOverride(body)) {
      const enabled = Boolean(els.bodyEditControlOverride?.checked);
      const { percentages, total } = bodyControlOverrideValuesFromForm();
      if (enabled && Math.abs(total - 100) > 0.05) {
        return flashMessage(`Faction-control percentages total ${Math.round(total * 10) / 10}%. They must equal exactly 100%.`);
      }
      body.controlOverride = { enabled, percentages };
    }

    const replacementTexture = bodySupportsTextureEditing(body) ? els.bodyEditTexture?.files?.[0] : null;
    if (replacementTexture) {
      try {
        const uploaded = await uploadOrEmbedBodyTexture(replacementTexture, body.id);
        body.textureUrl = uploaded.textureUrl;
        body.texturePath = uploaded.texturePath;
        body.textureDataUrl = uploaded.textureDataUrl;
        body.template = "custom";
        cacheBodyTexture(body, customTextureSource(body), { showError: true });
      } catch (err) {
        return flashMessage(err.message || String(err));
      }
    }

    body.lore = {
      diameter: els.bodyEditDiameter?.value.trim() || "",
      atmosphere: els.bodyEditAtmosphere?.value.trim() || "",
      rotationPeriod: els.bodyEditRotationPeriod?.value.trim() || "",
      orbitalPeriod: els.bodyEditOrbitalPeriod?.value.trim() || "",
      climate: toList(els.bodyEditClimate?.value),
      terrain: toList(els.bodyEditTerrain?.value),
      nativeSpecies: toList(els.bodyEditNativeSpecies?.value),
      languages: toList(els.bodyEditLanguages?.value),
      government: toList(els.bodyEditGovernment?.value),
      population: els.bodyEditPopulation?.value.trim() || "",
      majorImports: els.bodyEditMajorImports?.value.trim() || "",
      majorExports: els.bodyEditMajorExports?.value.trim() || ""
    };
    state.selectedBodyId = body.id;
    saveData();
    state.planetDirty = true;
    renderAllPanels();
    renderBodyIntelPanel();
    flashMessage(`Saved celestial body settings for ${body.name}.`);
  }


  function clearTerrainForm() {
    if (!els.terrainForm) return;
    els.terrainForm.reset();
    els.terrainId.value = "";
    if (els.terrainBody && bodiesForPlanetSelector().some(body => body.id === state.selectedBodyId)) {
      els.terrainBody.value = state.selectedBodyId;
    }
    els.terrainX.value = Number(state.planetPlacement?.x ?? 0.5).toFixed(3);
    els.terrainY.value = Number(state.planetPlacement?.y ?? 0.5).toFixed(3);
    els.terrainW.value = 0.22;
    els.terrainH.value = 0.14;
    els.terrainRotation.value = 0;
    els.terrainDensity.value = 0.65;
  }

  function loadTerrainIntoForm(terrain) {
    if (!terrain || !els.terrainForm) return;
    els.terrainId.value = terrain.id || "";
    els.terrainName.value = terrain.name || "";
    els.terrainBody.value = terrain.bodyId || state.selectedBodyId;
    els.terrainType.value = terrain.type || "mountain";
    els.terrainX.value = Number(terrain.x || 0.5).toFixed(3);
    els.terrainY.value = Number(terrain.y || 0.5).toFixed(3);
    els.terrainW.value = Number(terrain.w || 0.22).toFixed(3);
    els.terrainH.value = Number(terrain.h || 0.14).toFixed(3);
    els.terrainRotation.value = Number(terrain.rotation || 0).toFixed(3);
    els.terrainDensity.value = Number(terrain.density || 0.65).toFixed(2);
    els.terrainHazard.value = terrain.hazard || "";
  }

  function onTerrainSubmit(event) {
    event.preventDefault();
    if (!isGmPlus()) return flashMessage("Terrain editing requires GM or Web Admin role.");
    const id = els.terrainId.value || uuid("terrain");
    const terrain = {
      id,
      name: els.terrainName.value.trim(),
      bodyId: els.terrainBody.value,
      type: els.terrainType.value,
      x: clamp(Number(els.terrainX.value || 0.5), 0, 1),
      y: clamp(Number(els.terrainY.value || 0.5), 0, 1),
      w: clamp(Number(els.terrainW.value || 0.22), 0.01, 1),
      h: clamp(Number(els.terrainH.value || 0.14), 0.01, 1),
      rotation: Number(els.terrainRotation.value || 0),
      density: clamp(Number(els.terrainDensity.value || 0.65), 0, 1),
      hazard: els.terrainHazard.value.trim(),
      visibility: "public"
    };
    const idx = state.data.terrain.findIndex(t => t.id === id);
    if (idx >= 0) state.data.terrain[idx] = { ...state.data.terrain[idx], ...terrain };
    else state.data.terrain.push(terrain);
    state.selectedTerrainId = id;
    state.selectedBodyId = terrain.bodyId;
    state.selectedPoiId = null;
    saveData();
    state.planetDirty = true;
    renderAllPanels();
    flashMessage(`Saved terrain feature: ${terrain.name}.`);
  }

  function onDeleteTerrain() {
    if (!isGmPlus()) return flashMessage("Terrain editing requires GM or Web Admin role.");
    const id = els.terrainId.value;
    if (!id) return flashMessage("Load or save a terrain feature first.");
    const terrain = state.data.terrain.find(t => t.id === id);
    if (!terrain) return flashMessage("Terrain feature not found.");
    if (!confirm(`Delete ${terrain.name}?`)) return;
    state.data.terrain = state.data.terrain.filter(t => t.id !== id);
    state.selectedTerrainId = null;
    saveData();
    clearTerrainForm();
    state.planetDirty = true;
    renderAllPanels();
  }
  function onExportData() {
    if (!isRoot()) return flashMessage("Export requires Root Mode.");
    els.jsonOutput.value = JSON.stringify(state.data, null, 2);
    els.jsonOutput.focus();
    els.jsonOutput.select();
  }

  function onImportData(event) {
    if (!isRoot()) return flashMessage("Import requires Root Mode.");
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        state.data = migrateData(parsed);
        saveData();
        renderAllPanels();
        flashMessage("Imported campaign atlas JSON.");
      } catch (err) {
        flashMessage(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }

  function onResetData() {
    if (!isRoot()) return flashMessage("Reset requires Root Mode.");
    if (!confirm("Reset to seed data? Export first if you want to preserve edits.")) return;
    state.data = deepClone(seed);
    saveData();
    state.selectedBodyId = "brekka";
    state.selectedPoiId = null;
    state.selectedTerrainId = null;
    renderAllPanels();
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function roundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  // Load POI into editor when selected from the side panel by listening for changes to selectedPoiId.
  const originalRenderSelectedPanel = renderSelectedPanel;
  renderSelectedPanel = function patchedRenderSelectedPanel() {
    originalRenderSelectedPanel();
    const poi = state.selectedPoiId ? state.data.pois.find(p => p.id === state.selectedPoiId) : null;
    if (poi && isStaff()) loadPoiIntoForm(poi);
    const terrain = state.selectedTerrainId ? state.data.terrain.find(t => t.id === state.selectedTerrainId) : null;
    if (terrain && isStaff()) loadTerrainIntoForm(terrain);
  };

  function loadPoiIntoForm(poi) {
    els.poiId.value = poi.id;
    els.poiName.value = poi.name || "";
    els.poiBody.value = poi.bodyId || state.selectedBodyId;
    els.poiType.value = normalizePoiTypeId(poi.type || "tactical");
    els.poiSubtype.value = poi.subtype || "";
    refreshIconSelect(els.poiModel, els.poiType.value, poi.modelTemplateId || defaultIconForType(els.poiType.value));
    els.poiStrategicTier.value = poi.strategicTier || tierFromValue(Number(poi.strategicValue || 0));
    els.poiOwner.value = poi.factionId || state.data.factions[0].id;
    if (els.poiColor) els.poiColor.value = poi.color || "#c7d2e0";
    els.poiVisibility.value = poi.visibility || "public";
    els.poiStrategic.value = Number(poi.strategicValue || 0);
    els.poiTactical.value = Number(poi.tacticalValue || 0);
    els.poiDisplaySize.value = Number(poi.displaySize || defaultPoiDisplaySize(poi.type, poi.strategicTier, poi.modelTemplateId)).toFixed(2);
    els.poiTextSize.value = Number(poi.textSize ?? 1).toFixed(2);
    els.poiX.value = Number(poi.x || 0.5).toFixed(3);
    els.poiY.value = Number(poi.y || 0.5).toFixed(3);
    els.poiDescription.value = poi.description || "";
    els.poiGmNotes.value = poi.gmNotes || "";
    updatePoiFormMode();
    updateIconPreview(els.poiModel, els.poiIconPreview, els.poiOwner, els.poiColor, els.poiType);
  }


  function applyAuthenticatedRole(role) {
    const normalized = normalizeRole(role);
    if (state.role === normalized) return;
    state.role = normalized;
    localStorage.setItem("cc_role", normalized);
    renderAllPanels();
  }

  function applySharedData(sharedData) {
    if (!sharedData || typeof sharedData !== "object") return;
    state.data = migrateData(sharedData);
    state.lastSavedJson = JSON.stringify(state.data);
    localStorage.setItem(STORAGE_KEY, state.lastSavedJson);
    invalidateDataCaches();
    if (!state.data.bodies.some(body => body.id === state.selectedBodyId)) {
      state.selectedBodyId = firstTheaterBody()?.id || state.data.bodies[0]?.id || "";
    }
    state.selectedPoiId = state.data.pois.some(poi => poi.id === state.selectedPoiId) ? state.selectedPoiId : null;
    state.selectedTerrainId = state.data.terrain.some(item => item.id === state.selectedTerrainId) ? state.selectedTerrainId : null;
    state.textures = {};
    state.textureCanvases = {};
    state.systemTextureCanvases = {};
    state.systemBodySpriteCache.clear();
    state.systemOrbitLayerCache = null;
    state.planetBackgroundCache = null;
    state.globeRenderer = null;
    state.globeRendererUnavailable = false;
    loadTextures();
    state.planetDirty = true;
    renderAllPanels();
  }

  window.CC_ATLAS_API = {
    getRole: () => state.role,
    getActiveView: () => state.activeView,
    isAdmin,
    isRoot,
    isCommand: () => state.role === "command",
    getData: () => state.data,
    saveData,
    flashMessage,
    setView,
    applyAuthenticatedRole,
    escapeHtml,
    uuid,
    renderAllPanels,
    applySharedData,
    revertLastUserSave,
    updateRevertButtonState
  };

  init();
})();
