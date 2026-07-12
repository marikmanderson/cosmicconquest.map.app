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
    lastFrame: performance.now(),
    animationTime: performance.now()
  };

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

  function migrateData(data) {
    const clone = deepClone(data && typeof data === "object" ? data : seed);
    clone.meta ??= {};
    clone.meta.version = "0.4.5-prototype";
    clone.meta.deletedBodyIds = Array.isArray(clone.meta.deletedBodyIds)
      ? [...new Set(clone.meta.deletedBodyIds.filter(Boolean))]
      : [];
    const deletedBodyIds = new Set(clone.meta.deletedBodyIds);
    clone.visibilityStates = deepClone(seed.visibilityStates);
    clone.poiTypes = deepClone(seed.poiTypes);
    clone.modelTemplates = deepClone(seed.modelTemplates);
    clone.moonTemplates = mergeById(seed.moonTemplates, clone.moonTemplates);
    clone.factions = mergeById(seed.factions, clone.factions);
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
      .map(body => ({
        ...body,
        lore: normalizeBodyLore(body.lore || body),
        ...(body.id === "rantel-cluster"
          ? { asteroidVisualCount: clamp(Math.round(Number(body.asteroidVisualCount ?? 340)), 100, 1200) }
          : {})
      }));
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
          factionId: customColor ? "neutral" : poi.factionId,
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

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
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
    return state.data.bodies.filter(body => ["planet", "moon", "station", "asteroid_belt"].includes(body.type));
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

    els.systemCanvas.addEventListener("mousemove", onSystemMouseMove);
    els.systemCanvas.addEventListener("mouseleave", () => els.hoverCard.classList.add("hidden"));
    els.systemCanvas.addEventListener("click", onSystemClick);

    els.planetCanvas.addEventListener("mousemove", onPlanetMouseMove);
    els.planetCanvas.addEventListener("mouseleave", () => els.hoverCard.classList.add("hidden"));
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
    const current = select.value;
    select.innerHTML = items.map(item => `<option value="${escapeHtml(item[valueKey])}">${escapeHtml(item[labelKey])}</option>`).join("");
    if (items.some(item => item[valueKey] === current)) select.value = current;
  }


  function refreshIconSelect(select, typeId, preferredId = "") {
    if (!select) return;
    const options = templatesForType(typeId);
    const desired = preferredId || select.value || defaultIconForType(typeId);
    select.innerHTML = options.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`).join("");
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
    if (state.activeView === "admin" && !isAdmin()) setView("system");
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
    renderSystemControlPanel();
    renderSelectedPanel();
    renderPoiList();
    renderAdminLists();
    renderAdminAccessState();
    updatePlanetViewUi();
    renderBodyIntelPanel();
    window.CC_LOGISTICS?.render?.();
    state.planetDirty = true;
    if (state.activeView === "planet") renderPlanet();
  }

  function flashMessage(message) {
    els.selectedTitle.textContent = "Command Notice";
    els.selectedInfo.innerHTML = `<p>${escapeHtml(message)}</p>`;
  }

  function resizeCanvas(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
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
    const dt = now - state.lastFrame;
    state.lastFrame = now;
    if (!state.paused) state.animationTime += dt;
    try {
      renderSystem(now);
    } catch (err) {
      console.error("System map render failed", err);
      drawCanvasNotice(els.systemCanvas, systemCtx, "System map render failed", err.message || String(err));
    }
    const selectedPlanetBody = bodyById(state.selectedBodyId);
    const animatePlanetSatellites = state.activeView === "planet"
      && state.planetViewMode === "globe"
      && !state.settings.disableSatellites
      && !state.paused
      && state.planetCamera.zoom <= 0.72
      && Boolean(selectedPlanetBody && state.data.bodies.some(body => body.parentBodyId === selectedPlanetBody.id));
    if (state.activeView === "planet" && (state.planetDirty || animatePlanetSatellites)) {
      try {
        renderPlanet();
      } catch (err) {
        console.error("Planet map render failed", err);
        drawCanvasNotice(els.planetCanvas, planetCtx, "Planet theater render failed", err.message || String(err));
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
    const grd = ctx.createRadialGradient(width * .52, height * .44, 60, width * .52, height * .52, Math.max(width, height));
    grd.addColorStop(0, "rgba(10, 28, 52, 0.7)");
    grd.addColorStop(.42, "rgba(3, 7, 15, 0.82)");
    grd.addColorStop(1, "rgba(0, 1, 5, 1)");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);

    const count = Math.floor((width * height) / 5400);
    for (let i = 0; i < count; i++) {
      const p = pseudoPoint(i);
      const x = p.x * width;
      const y = p.y * height;
      const alpha = 0.28 + (p.z * 0.72);
      const size = p.z > .95 ? 1.9 : 1.05;
      ctx.fillStyle = `rgba(235, 248, 255, ${alpha})`;
      ctx.fillRect(x, y, size, size);
    }
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

  function drawAsteroidBelt(ctx, center, scale) {
    const belt = bodyById("rantel-cluster");
    if (!belt?.orbitRadius) return;
    const radius = belt.orbitRadius * scale;
    const time = state.animationTime * (belt.orbitSpeed || 0.000006);
    ctx.save();
    ctx.strokeStyle = "rgba(210, 230, 255, 0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(center.x, center.y, radius, radius * 0.64, 0, 0, Math.PI * 2);
    ctx.stroke();

    const asteroidCount = clamp(Math.round(Number(belt.asteroidVisualCount ?? 340)), 100, 1200);
    for (let i = 0; i < asteroidCount; i++) {
      const p = pseudoPoint(i + 2200);
      const angle = p.x * Math.PI * 2 + time + (i % 7) * .006;
      const jitter = (p.y - .5) * 58 * scale;
      const rx = radius + jitter;
      const ry = (radius + jitter) * 0.64;
      const x = center.x + Math.cos(angle) * rx;
      const y = center.y + Math.sin(angle) * ry;
      const size = 1 + p.z * 3.1;
      ctx.strokeStyle = `rgba(230, 238, 245, ${0.18 + p.z * 0.36})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y, size * 1.7, size, angle, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (state.settings.disableNames) {
      state.systemHits.push({ kind: "body", id: belt.id, x: center.x + radius * 1.02, y: center.y - 8, r: Math.max(58, 80 * scale) });
      ctx.restore();
      return;
    }

    const labelX = center.x + radius * 1.02;
    const labelY = center.y - 8;
    ctx.font = `${Math.max(16, 25 * scale)}px Arial Narrow, Bahnschrift, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,.9)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "rgba(244,248,255,.94)";
    ctx.fillText((belt.shortName || belt.name).toUpperCase(), labelX, labelY);
    ctx.font = `${Math.max(10, 12 * scale)}px Arial Narrow, Bahnschrift, sans-serif`;
    ctx.fillStyle = "rgba(109,247,255,.62)";
    ctx.fillText("OUTER ASTEROID BELT", labelX, labelY + 22);
    const textWidth = ctx.measureText((belt.shortName || belt.name).toUpperCase()).width;
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

  function drawBody(ctx, body, x, y, r, scale) {
    if (body.type === "station") return drawStation(ctx, body, x, y, r);
    const grad = ctx.createRadialGradient(x - r * .38, y - r * .42, r * .12, x, y, r);
    grad.addColorStop(0, body.colorB || "#ffffff");
    grad.addColorStop(.52, body.colorA || "#999999");
    grad.addColorStop(1, body.type === "star" ? "#07111d" : "rgba(10, 24, 38, .82)");

    ctx.save();
    ctx.shadowColor = body.type === "star" ? "rgba(255,95,22,.95)" : "rgba(84,180,255,.32)";
    ctx.shadowBlur = body.type === "star" ? 42 : 12;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    drawBodyTexture(ctx, body, x, y, r);
    ctx.restore();

    ctx.strokeStyle = body.id === state.selectedBodyId ? "rgba(109,247,255,.95)" : "rgba(255,255,255,.18)";
    ctx.lineWidth = body.id === state.selectedBodyId ? 2 : 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
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
    ctx.globalAlpha = body.textureDataUrl || body.template === "custom" ? .56 : .32;
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
    ctx.shadowColor = "rgba(0,0,0,.9)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "rgba(244,248,255,.94)";
    const label = body.shortName || body.name;
    const dy = body.type === "moon" ? r + 6 : r + 12;
    ctx.fillText(label.toUpperCase(), x, y + dy);
    if (state.showIntelOverlay) {
      ctx.fillStyle = color;
      ctx.font = `${Math.max(9, Math.min(13, r * .42))}px Arial Narrow, Bahnschrift, sans-serif`;
      ctx.fillText(control.total ? `${dominant ? factionById(dominant.id).code : "UNK"} ${formatPercent((dominant?.value || 0) / control.total * 100)}` : "NO DATA", x, y + dy + 18);
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
      if (view === "planet") { state.planetDirty = true; renderPlanet(); }
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
        renderPlanet();
      } else {
        const camera = cameraForView(view);
        camera.x += dx / camera.zoom;
        camera.y += dy / camera.zoom;
        constrainCamera(view);
        if (view === "planet") { state.planetDirty = true; renderPlanet(); }
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
      if (view === "planet") {
        state.planetDirty = true;
        renderPlanet();
      }
      if (view === "system") renderSystem();
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

  function onSystemMouseMove(event) {
    if (state.dragCamera?.view === "system") return;
    const point = getCanvasWorldPoint(event, els.systemCanvas, state.systemCamera);
    const hit = hitTest(state.systemHits, point);
    if (!hit) {
      els.hoverCard.classList.add("hidden");
      return;
    }
    const body = bodyById(hit.id);
    if (!body) return;
    showHover(event.clientX, event.clientY, bodyHoverHtml(body));
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

  function showHover(clientX, clientY, html) {
    els.hoverCard.innerHTML = html;
    els.hoverCard.classList.remove("hidden");
    const rect = els.hoverCard.getBoundingClientRect();
    let left = clientX + 16;
    let top = clientY + 16;
    if (left + rect.width > window.innerWidth - 12) left = clientX - rect.width - 16;
    if (top + rect.height > window.innerHeight - 12) top = clientY - rect.height - 16;
    els.hoverCard.style.left = `${left}px`;
    els.hoverCard.style.top = `${top}px`;
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
    const dpr = window.devicePixelRatio || 1;
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
  ctx.save();
  ctx.fillStyle = "rgba(3, 12, 22, .94)";
  ctx.strokeStyle = "rgba(122, 202, 255, .46)";
  ctx.lineWidth = 2;
  roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, 18);
  ctx.fill();
  ctx.stroke();
  ctx.clip();
  if (img?.complete) {
    ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
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
    const grad = ctx.createRadialGradient(width * .42, height * .24, 10, width * .55, height * .62, Math.max(width, height));
    grad.addColorStop(0, "rgba(36, 108, 171, .14)");
    grad.addColorStop(.5, "rgba(2, 8, 17, .88)");
    grad.addColorStop(1, "rgba(0, 2, 7, 1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const count = Math.floor((width * height) / 7000);
    for (let i = 0; i < count; i++) {
      const p = pseudoPoint(i + 6400);
      const alpha = .18 + p.z * .42;
      ctx.fillStyle = `rgba(235,248,255,${alpha})`;
      ctx.fillRect(p.x * width, p.y * height, p.z > .94 ? 2 : 1, p.z > .94 ? 2 : 1);
    }

    ctx.save();
    ctx.globalAlpha = .06;
    ctx.strokeStyle = "#dbefff";
    for (let i = 0; i < 12; i++) {
      const y = (height / 12) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    for (let i = 0; i < 18; i++) {
      const x = (width / 18) * i;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    ctx.restore();

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
    if (body?.textureDataUrl) return body.id;
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

  function loadTextures() {
    const manifest = {
      "osiris-prime": "assets/textures/osiris-prime_map.png",
      vau: "assets/textures/vau_map.png",
      brekka: "assets/textures/brekka_map.png",
      vulkan: "assets/textures/vulkan_map.png",
      barren: "assets/textures/barren_map.png",
      oceanic: "assets/textures/oceanic_map.png",
      urban: "assets/textures/urban_map.png",
      lush: "assets/textures/lush_map.png"
    };
    Object.entries(manifest).forEach(([key, src]) => {
      const img = new Image();
      img.onload = () => {
        state.textures[key] = img;
        makeSystemTexture(key, img);
        makeGlobeRenderTexture(key, img);
        state.planetDirty = true;
      };
      img.src = src;
    });
    for (const body of state.data.bodies || []) {
      const textureSource = body.textureUrl || body.textureDataUrl;
      if (!textureSource) continue;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        state.textures[body.id] = img;
        makeSystemTexture(body.id, img);
        makeGlobeRenderTexture(body.id, img);
        state.planetDirty = true;
      };
      img.src = textureSource;
    }
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

  function renderTexturedSphere(ctx, globe, body) {
    const img = state.textures[textureKeyForBody(body)];
    if (!textureReady(img)) {
      drawProceduralSphereFallback(ctx, globe, body);
      return;
    }

    try {
      drawEquirectangularTextureOnSphere(ctx, globe, body, img);
    } catch (err) {
      console.warn("Direct texture sphere failed; falling back to procedural globe.", err);
      drawProceduralSphereFallback(ctx, globe, body);
    }
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
    const step = dragging ? 5 : (zoom >= 3.6 ? 2 : 3);
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

    const shade = ctx.createRadialGradient(cx - r * .32, cy - r * .34, r * .08, cx, cy, r);
    shade.addColorStop(0, "rgba(255,255,255,.10)");
    shade.addColorStop(.44, "rgba(255,255,255,0)");
    shade.addColorStop(.78, "rgba(0,0,0,.18)");
    shade.addColorStop(1, "rgba(0,0,0,.56)");
    ctx.fillStyle = shade;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
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
      els.hoverCard.classList.add("hidden");
      return;
    }
    if (hit.kind === "poi") {
      const poi = state.data.pois.find(p => p.id === hit.id);
      if (poi) showHover(event.clientX, event.clientY, poiHoverHtml(poi));
      return;
    }
    if (hit.kind === "terrain") {
      const terrain = state.data.terrain.find(t => t.id === hit.id);
      if (terrain) showHover(event.clientX, event.clientY, terrainHoverHtml(terrain));
      return;
    }
    if (hit.kind === "body") {
      const body = bodyById(hit.id);
      if (body) showHover(event.clientX, event.clientY, bodyHoverHtml(body));
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
    const scores = Object.fromEntries(state.data.factions.map(f => [f.id, 0]));
    let total = 0;
    const overriddenBodies = new Set(state.data.bodies.filter(body => manualBodyControl(body)).map(body => body.id));
    const pois = state.data.pois.filter(poi => !overriddenBodies.has(poi.bodyId) && (actual || canSeeForPublic(poi)));
    for (const poi of pois) {
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
      for (const faction of state.data.factions) {
        scores[faction.id] = (scores[faction.id] || 0) + Number(manual.scores[faction.id] || 0);
      }
      total += manual.total;
    }
    return { scores, total };
  }

  function calculateBodyControl(bodyId, actual = false) {
    const body = bodyById(bodyId);
    const manual = manualBodyControl(body);
    if (manual) return manual;

    const scores = Object.fromEntries(state.data.factions.map(f => [f.id, 0]));
    let total = 0;
    const pois = state.data.pois.filter(poi => poi.bodyId === bodyId && (actual || canSeeForPublic(poi)));
    for (const poi of pois) {
      const val = Number(poi.strategicValue || 0);
      scores[poi.factionId] = (scores[poi.factionId] || 0) + val;
      total += val;
    }
    for (const bonus of calculateSectorBonuses(actual).filter(b => b.bodyId === bodyId)) {
      scores[bonus.factionId] = (scores[bonus.factionId] || 0) + bonus.value;
      total += bonus.value;
    }

    // Any manually controlled linked body contributes its Strategic Weight to its parent body while the parent remains automatic.
    for (const child of state.data.bodies.filter(item => item.parentBodyId === bodyId)) {
      const childManual = manualBodyControl(child);
      if (!childManual) continue;
      for (const faction of state.data.factions) {
        scores[faction.id] = (scores[faction.id] || 0) + Number(childManual.scores[faction.id] || 0);
      }
      total += childManual.total;
    }
    return { scores, total };
  }

  function canSeeForPublic(item) {
    const visibility = item.visibility || "public";
    return visibility === "public" || visibility === "discovered";
  }

  function calculateSectorBonuses(actual = false) {
    const bonuses = [];
    for (const sector of state.data.sectors) {
      const sectorPois = state.data.pois.filter(p => p.sectorId === sector.id && (actual || canSeeForPublic(p)));
      if (!sectorPois.length) continue;
      const byFaction = new Map();
      for (const poi of sectorPois) {
        const value = Number(poi.strategicValue || 0);
        byFaction.set(poi.factionId, (byFaction.get(poi.factionId) || 0) + value);
      }
      const totalValue = [...byFaction.values()].reduce((sum, value) => sum + value, 0);
      if (!totalValue) continue;
      for (const [factionId, value] of byFaction.entries()) {
        if (value / totalValue >= Number(sector.threshold || 1)) {
          bonuses.push({ sectorId: sector.id, bodyId: sector.bodyId, factionId, value: Number(sector.bonusValue || 0) });
          break;
        }
      }
    }
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
    els.factionList.innerHTML = state.data.factions.map(faction => `
      <div class="record-item">
        <span style="display:flex;align-items:center;gap:8px;"><span class="record-swatch" style="color:${faction.color};background:${faction.color}"></span>${escapeHtml(faction.name)}</span>
        <button class="ghost-button" data-edit-faction="${escapeHtml(faction.id)}">Edit</button>
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
  }

  function renderAdminAccessState() {
    const adminAllowed = isAdmin();
    const rootAllowed = isRoot();
    const adminInputs = [
      ...els.factionForm.querySelectorAll("input, button"),
      ...els.moonForm.querySelectorAll("input, select, button"),
      ...(els.bodyForm ? els.bodyForm.querySelectorAll("input, select, button") : [])
    ];
    adminInputs.forEach(input => {
      input.disabled = !adminAllowed;
      input.title = adminAllowed ? "" : "Requires Admin or Root Mode.";
    });
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

    if (textureFile && window.CC_LOGISTICS?.uploadAtlasTexture) {
      try {
        const uploaded = await window.CC_LOGISTICS.uploadAtlasTexture(textureFile, moonId);
        textureUrl = uploaded?.url || null;
        texturePath = uploaded?.path || null;
      } catch (err) {
        console.warn("Shared texture upload failed; keeping a local browser copy.", err);
        flashMessage(`Shared texture upload failed: ${err.message || err}. The moon will use a local-only texture until uploaded again.`);
      }
    }
    if (textureFile && !textureUrl) {
      textureDataUrl = await readFileAsDataUrl(textureFile);
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
    const textureSource = textureUrl || textureDataUrl;
    if (textureSource) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        state.textures[newMoon.id] = img;
        makeSystemTexture(newMoon.id, img);
        makeGlobeRenderTexture(newMoon.id, img);
        state.planetDirty = true;
        renderAllPanels();
      };
      img.src = textureSource;
    }
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
    els.bodyEditName.value = body.name || "";
    els.bodyEditRadius.value = Number(body.radius || 10);
    const usesPrimaryOrbit = bodyUsesPrimarySystemOrbit(body);
    const orbitRadius = usesPrimaryOrbit
      ? (body.orbitRadius || 100)
      : (body.moonOrbitRadius || body.satelliteOrbitRadius || body.orbitRadius || 56);
    const orbitSpeed = usesPrimaryOrbit
      ? (body.orbitSpeed || 0.00002)
      : (body.moonOrbitSpeed || body.satelliteOrbitSpeed || body.orbitSpeed || 0.00006);
    els.bodyEditOrbitRadius.value = Number(orbitRadius);
    els.bodyEditOrbitSpeed.value = Number(orbitSpeed);
    els.bodyEditWeight.value = Number(body.strategicWeight || 0);
    renderAsteroidDensityEditor(body);
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

  function onBodySubmit(event) {
    event.preventDefault();
    if (!isAdmin()) return flashMessage("Celestial body editing requires Admin or Root Mode.");
    const body = bodyById(els.bodyEditSelect.value);
    if (!body) return flashMessage("Select a celestial body to edit.");
    body.name = els.bodyEditName.value.trim() || body.name;
    body.shortName = body.shortName || body.name;
    body.radius = clamp(Number(els.bodyEditRadius.value || body.radius || 10), 1, 120);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
    if (!state.data.bodies.some(body => body.id === state.selectedBodyId)) {
      state.selectedBodyId = firstTheaterBody()?.id || state.data.bodies[0]?.id || "";
    }
    state.selectedPoiId = state.data.pois.some(poi => poi.id === state.selectedPoiId) ? state.selectedPoiId : null;
    state.selectedTerrainId = state.data.terrain.some(item => item.id === state.selectedTerrainId) ? state.selectedTerrainId : null;
    state.textures = {};
    state.textureCanvases = {};
    state.systemTextureCanvases = {};
    loadTextures();
    state.planetDirty = true;
    renderAllPanels();
  }

  window.CC_ATLAS_API = {
    getRole: () => state.role,
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
    applySharedData
  };

  init();
})();
