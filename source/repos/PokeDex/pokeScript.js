// Global variables
var input = document.getElementById("userInput");
const body = document.body; // used to apply dynamic background gradients
const moreDetailsList = document.getElementById("moreDetailsList");

// Card DOM references (deferred script ensures these exist)
const nameEl = document.getElementById("pokeNameResult");
const idEl = document.getElementById("pokeIdResult");
const typeEl = document.getElementById("pokeTypeResult");
const spriteImg = document.getElementById("pokeSpriteResult");
const descEl = document.getElementById("pokeDescResult");
const statHPEl = document.getElementById("statHP");
const statAtkEl = document.getElementById("statAtk");
const statDefEl = document.getElementById("statDef");
const baseExpEl = document.getElementById("pokeBaseExp");
const footerRight = document.getElementById("pokeFooter");

// Placeholder values for the initial blank card and on validation failure.
// Keeps the UI readable and consistent (no JSON blobs, no broken images).
const PLACEHOLDERS = {
    name: "Pokemon Name",
    id: "#ID",
    typesHTML: `<span class="type-badge">—</span>`,
    desc: "Search for a Pokémon by name or number to see details here.",
    hp: "-",
    atk: "-",
    def: "-",
    baseExp: "—",
    footer: "",
    spriteAlt: "No image available",
};

// Mapping of Pokémon types to two colors used to build a gradient.
// Adjust hex values if you prefer other tones.
const typeColors = {
    normal: ["#A8A77A", "#DAD7A0"],
    fire: ["#FF9C54", "#FFB86B"],
    water: ["#4592C4", "#79BFFF"],
    grass: ["#9BCC50", "#C7F48B"],
    electric: ["#F7D02C", "#FFF386"],
    ice: ["#96D9D6", "#DDF7F6"],
    fighting: ["#C22E28", "#E89A96"],
    poison: ["#A33EA1", "#CFA0D6"],
    ground: ["#E2BF65", "#F0D9A4"],
    flying: ["#A98FF3", "#D8C9FF"],
    psychic: ["#F95587", "#FFB3BF"],
    bug: ["#A6B91A", "#DFF08A"],
    rock: ["#B6A136", "#D9C69A"],
    ghost: ["#735797", "#B99ED8"],
    dragon: ["#6F35FC", "#A78BFF"],
    dark: ["#705746", "#A0897A"],
    steel: ["#B7B7CE", "#DCDCDF"],
    fairy: ["#D685AD", "#F6C7D9"],
};

// Apply a background gradient to the page based on the pokemon's type(s).
// - If two types exist, use primary colors for each.
// - If one type exists, use the two colors defined for that type.
// - If types are unknown or not in the map, clear inline style so CSS fallback applies.
function applyBackgroundGradient(types) {
    // Ensure transition for smooth visual change
    body.style.transition = "background 450ms ease";

    if (!types || types.length === 0) {
        // No valid types: remove inline background so stylesheet value (ghostwhite) applies
        body.style.background = "";
        return;
    }

    // Normalize to type names (strings) and pick up to two types
    const normalized = types
        .map((t) => (typeof t === "string" ? t : t.type?.name))
        .filter(Boolean);
    const firstType = normalized[0];
    const secondType = normalized[1];

    const c1 = typeColors[firstType]?.[0];
    // prefer second type color if it exists; otherwise use the second shade for first type
    const c2 = secondType
        ? typeColors[secondType]?.[0]
        : typeColors[firstType]?.[1];

    if (c1 && c2) {
        // Example gradient angle: 135deg for diagonal look
        body.style.background = `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
    } else if (c1) {
        // Fallback to single color if mapping is missing for second
        body.style.background = c1;
    } else {
        // If mapping missing entirely, clear inline style to fall back to CSS
        body.style.background = "";
    }
}

// Format helpers
function capitalize(s) {
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Reset card UI back to placeholder state.
// Used on initial load and when validation/fetch fails so the card doesn't show partial/invalid data.
function resetCardToPlaceholder() {
    if (nameEl) nameEl.textContent = PLACEHOLDERS.name;
    if (idEl) idEl.textContent = PLACEHOLDERS.id;
    if (typeEl) typeEl.innerHTML = PLACEHOLDERS.typesHTML;
    if (descEl) descEl.textContent = PLACEHOLDERS.desc;

    // Stat blocks: ensure structure remains (strong/small) and labels are shown
    function setStatPlaceholder(el, value, label) {
        if (!el) return;
        const strong = el.querySelector("strong");
        const small = el.querySelector("small");
        if (strong) strong.textContent = value;
        if (small) small.textContent = label;
        el.style.opacity = "0.6";
    }
    setStatPlaceholder(statHPEl, PLACEHOLDERS.hp, "HP");
    setStatPlaceholder(statAtkEl, PLACEHOLDERS.atk, "Attack");
    setStatPlaceholder(statDefEl, PLACEHOLDERS.def, "Defense");

    if (baseExpEl) baseExpEl.textContent = PLACEHOLDERS.baseExp;
    if (footerRight) footerRight.textContent = PLACEHOLDERS.footer;

    // Clear sprite safely (do not attempt to fetch or display anything)
    if (spriteImg) {
        spriteImg.src = "";
        spriteImg.alt = PLACEHOLDERS.spriteAlt;
    }

    // Reset background to default stylesheet value
    applyBackgroundGradient([]);
}

// Build readable content for complex fields.
// Converts arrays/objects to friendly text (not raw JSON).
function humanizeField(key, value) {
    if (value === null || value === undefined) return "None";

    // Arrays: try to extract names if objects contain them, otherwise join primitives.
    if (Array.isArray(value)) {
        if (value.length === 0) return "None";
        // If objects with ability/move/form keys exist, map to names
        const namey = value
            .map((item) => {
                if (!item) return null;
                if (typeof item === "string" || typeof item === "number")
                    return String(item);
                // common API shapes: { ability: { name } }, { move: { name } }, { item: { name } }, { version: { name } }
                if (item.ability?.name)
                    return item.ability.name.replace("-", " ");
                if (item.move?.name) return item.move.name.replace("-", " ");
                if (item.item?.name) return item.item.name.replace("-", " ");
                if (item.version?.name) return item.version.name;
                if (item.name) return item.name;
                // fallback to a short summary if object has url
                if (item.url) return item.url;
                return null;
            })
            .filter(Boolean);

        // Deduplicate and limit length for readability
        const uniq = [...new Set(namey)];
        if (uniq.length <= 8) return uniq.map(capitalize).join(", ");
        return (
            uniq.slice(0, 8).map(capitalize).join(", ") +
            `, and ${uniq.length - 8} more`
        );
    }

    // Objects: try to show the name field, otherwise show simple key/value pairs.
    if (typeof value === "object") {
        if (value.name) return capitalize(value.name);
        if (value.url) return value.url;
        // show relevant primitive properties if present (e.g., pokemon.game_indices etc.)
        const keys = Object.keys(value).filter(
            (k) => typeof value[k] === "string" || typeof value[k] === "number"
        );
        if (keys.length)
            return keys.map((k) => `${capitalize(k)}: ${value[k]}`).join("; ");
        return "See details";
    }

    // primitives
    return String(value);
}

// Utility: detect URLs
function isUrl(s) {
    return typeof s === "string" && /^https?:\/\//i.test(s);
}

// Populate the More Details panel with readable, expandable sections.
// Excludes fields that are already presented on the main card.
function populateMoreDetails(pokemonObj) {
    const list = moreDetailsList;
    if (!list) return;

    list.innerHTML = "";
    ``;
    if (!pokemonObj || typeof pokemonObj !== "object") {
        const li = document.createElement("li");
        li.textContent = "No extra details available.";
        list.appendChild(li);
        return;
    }

    // Keys shown on main card (skip these) or not desired in details panel
    const skipKeys = new Set([
        "name",
        "id",
        "types",
        "sprites",
        "stats",
        "height",
        "weight",
        "base_experience",
        "species",
        "order",
        "abilities",
        "held_items",
        "is_default",
        "past_abilities",
        "past_types",
    ]);

    // Iterate remaining keys in predictable order
    Object.keys(pokemonObj)
        .sort()
        .forEach((key) => {
            if (skipKeys.has(key)) return;
            const value = pokemonObj[key];

            const li = document.createElement("li");

            // Toggle header (collapsed by default)
            const btn = document.createElement("button");
            btn.className = "detail-toggle";
            btn.type = "button";
            btn.setAttribute("aria-expanded", "false");

            const title = document.createElement("span");
            title.textContent = capitalize(key.replace(/_/g, " "));

            const summary = document.createElement("span");
            summary.className = "detail-summary";
            // Provide a short human-readable summary
            // Special-case moves to show count (we will render full move list below)
            if (key === "moves" && Array.isArray(value)) {
                summary.textContent = `${value.length} move${value.length === 1 ? "" : "s"}`;
            } else {
                summary.textContent = humanizeField(key, value);
            }

            const chevron = document.createElement("span");
            chevron.className = "detail-chevron";
            chevron.textContent = "›";

            btn.appendChild(title);
            btn.appendChild(summary);
            btn.appendChild(chevron);

            // Detail content (readable text)
            const content = document.createElement("div");
            content.className = "detail-content";

            // Special handling for moves: list all move names and concise learn-method/version info
            if (key === "moves" && Array.isArray(value)) {
                const movesList = document.createElement("ul");
                movesList.style.paddingLeft = "18px";
                value.forEach((moveItem) => {
                    const itemLi = document.createElement("li");
                    itemLi.style.marginBottom = "8px";

                    const moveName = moveItem?.move?.name
                        ? capitalize(moveItem.move.name.replace(/-/g, " "))
                        : humanizeField(key, moveItem);

                    const titleDiv = document.createElement("div");
                    titleDiv.style.fontWeight = "700";
                    titleDiv.textContent = moveName;
                    itemLi.appendChild(titleDiv);

                    // Show concise version/learn method info if available
                    const details = moveItem?.version_group_details;
                    if (Array.isArray(details) && details.length > 0) {
                        // Build small meta string with deduped entries
                        const metaEntries = details
                            .map((d) => {
                                const method =
                                    d.move_learn_method?.name?.replace(
                                        /-/g,
                                        " "
                                    ) || "";
                                const lvl =
                                    typeof d.level_learned_at === "number"
                                        ? d.level_learned_at
                                        : null;
                                const vg =
                                    d.version_group?.name?.replace(/-/g, " ") ||
                                    "";
                                let entry = method;
                                if (lvl !== null && lvl !== 0)
                                    entry += ` @${lvl}`;
                                if (vg) entry += ` (${vg})`;
                                return entry.trim();
                            })
                            .filter(Boolean);

                        // dedupe and limit to a few entries for readability
                        const uniqMeta = [...new Set(metaEntries)];
                        const metaText =
                            uniqMeta.length <= 4
                                ? uniqMeta.join("; ")
                                : uniqMeta.slice(0, 4).join("; ") +
                                  `, and ${uniqMeta.length - 4} more`;

                        const metaDiv = document.createElement("div");
                        metaDiv.style.fontSize = "0.85rem";
                        metaDiv.style.color = "#444";
                        metaDiv.style.marginTop = "4px";
                        metaDiv.textContent = metaText;
                        itemLi.appendChild(metaDiv);
                    }

                    movesList.appendChild(itemLi);
                });

                content.appendChild(movesList);
            } else if (Array.isArray(value)) {
                // Generic array handling (humanized)
                const innerList = document.createElement("ul");
                value.forEach((item) => {
                    const itemLi = document.createElement("li");
                    // If the item is a URL string, create a link
                    if (isUrl(item)) {
                        const a = document.createElement("a");
                        a.href = item;
                        a.target = "_blank";
                        a.rel = "noopener noreferrer";
                        a.textContent = item;
                        itemLi.appendChild(a);
                    } else {
                        itemLi.textContent = humanizeField(key, item);
                    }
                    innerList.appendChild(itemLi);
                });
                content.appendChild(innerList);
            } else if (typeof value === "object" && value !== null) {
                // try to render meaningful subfields
                const subPairs = document.createElement("div");
                Object.keys(value).forEach((subKey) => {
                    const val = value[subKey];
                    const p = document.createElement("p");
                    p.style.margin = "4px 0";
                    // If the sub-value is a URL, render as a clickable link
                    if (isUrl(val)) {
                        const a = document.createElement("a");
                        a.href = val;
                        a.target = "_blank";
                        a.rel = "noopener noreferrer";
                        a.textContent = val;
                        p.textContent = `${capitalize(subKey.replace(/_/g, " "))}: `;
                        p.appendChild(a);
                    } else {
                        p.textContent = `${capitalize(subKey.replace(/_/g, " "))}: ${humanizeField(subKey, val)}`;
                    }
                    subPairs.appendChild(p);
                });
                content.appendChild(subPairs);
            } else {
                // Primitive: if this key is known to be a URL or the value is a URL, show link
                if (key === "location_area_encounters" && isUrl(value)) {
                    const a = document.createElement("a");
                    a.href = value;
                    a.target = "_blank";
                    a.rel = "noopener noreferrer";
                    a.textContent = "Open encounters";
                    content.appendChild(a);
                } else if (key === "cries") {
                    // 'cries' may be a string or array of urls; attempt to show clickable links if present
                    if (isUrl(value)) {
                        const a = document.createElement("a");
                        a.href = value;
                        a.target = "_blank";
                        a.rel = "noopener noreferrer";
                        a.textContent = "Play cry / Open resource";
                        content.appendChild(a);
                    } else {
                        const p = document.createElement("p");
                        p.style.margin = "0";
                        p.textContent = humanizeField(key, value);
                        content.appendChild(p);
                    }
                } else {
                    const p = document.createElement("p");
                    p.style.margin = "0";
                    p.textContent = humanizeField(key, value);
                    content.appendChild(p);
                }
            }

            // Toggle behavior
            btn.addEventListener("click", () => {
                const expanded = btn.getAttribute("aria-expanded") === "true";
                btn.setAttribute("aria-expanded", String(!expanded));
                if (expanded) {
                    content.style.display = "none";
                } else {
                    content.style.display = "block";
                }
            });

            li.appendChild(btn);
            li.appendChild(content);
            list.appendChild(li);
        });

    // If no details created, show placeholder
    if (list.children.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No additional details available.";
        list.appendChild(li);
    }
}

// Async function to fetch Pokemon data based on name or ID
// Adds response.ok check and throws a meaningful error for the caller to handle.
async function getPokemon(nameOrId) {
    let url;
    if (typeof nameOrId === "string" && isNaN(nameOrId)) {
        url = `https://pokeapi.co/api/v2/pokemon/${nameOrId.toLowerCase()}`;
    } else {
        url = `https://pokeapi.co/api/v2/pokemon/${nameOrId}`;
    }

    const response = await fetch(url);
    // If fetch succeeded but API returned a non-2xx status, throw an error so caller can show a friendly message.
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(
                "Pokemon not found. Check the name or number and try again."
            );
        } else {
            throw new Error(
                `Failed to fetch Pokémon (status ${response.status}).`
            );
        }
    }

    const data = await response.json();
    console.log(data); // for debugging
    return data;
}

// Build a friendly, card-styled description and populate visible stats (HP/ATK/DEF).
// Uses values from the /pokemon endpoint and formats them for UI display (not raw JSON).
function fillDescriptionAndStats(pokemon) {
    // Description: build a short, human-friendly blurb
    const types = (pokemon.types || [])
        .map((t) => t.type?.name)
        .filter(Boolean);
    const typeText = types.length
        ? types.map(capitalize).join(" / ")
        : "Unknown type";

    // height is in decimeters, weight in hectograms (per PokeAPI)
    const heightMeters = pokemon.height
        ? (pokemon.height / 10).toFixed(1)
        : "?.?";
    const weightKg = pokemon.weight ? (pokemon.weight / 10).toFixed(1) : "?.?";

    // Abilities: list names (mark hidden)
    const abilities = (pokemon.abilities || []).map((a) => {
        const name = a.ability?.name
            ? a.ability.name.replace("-", " ")
            : String(a.ability?.name || "");
        return a.is_hidden ? `${capitalize(name)} (Hidden)` : capitalize(name);
    });

    const abilitiesText = abilities.length ? abilities.join(", ") : "None";

    // Compose a concise description suitable for a Pokemon card
    if (descEl) {
        descEl.textContent =
            `${capitalize(pokemon.name)} — ${typeText} Pokémon. ` +
            `Height: ${heightMeters} m · Weight: ${weightKg} kg. ` +
            `Abilities: ${abilitiesText}.`;
    }

    // Stats: find HP / Attack / Defense values
    const statsMap = {};
    (pokemon.stats || []).forEach((s) => {
        const key = s.stat?.name;
        if (key) statsMap[key.toLowerCase()] = s.base_stat;
    });

    const hp = statsMap["hp"] ?? null;
    const atk = statsMap["attack"] ?? null;
    const def = statsMap["defense"] ?? null;

    // Helper to populate a stat block by id
    function setStatBlock(elId, value, label) {
        const el = document.getElementById(elId);
        if (!el) return;
        const strong = el.querySelector("strong");
        const small = el.querySelector("small");
        if (value !== null && typeof value !== "undefined") {
            if (strong) strong.textContent = String(value);
            if (small) small.textContent = label;
            el.style.opacity = "1";
        } else {
            if (strong) strong.textContent = "-";
            if (small) small.textContent = label;
            el.style.opacity = "0.6";
        }
    }

    setStatBlock("statHP", hp, "HP");
    setStatBlock("statAtk", atk, "Attack");
    setStatBlock("statDef", def, "Defense");

    // Base experience in footer
    if (baseExpEl)
        baseExpEl.textContent = String(pokemon.base_experience ?? "N/A");

    // Small footer/right content e.g., order or species
    if (footerRight) {
        const speciesName = pokemon.species?.name
            ? capitalize(pokemon.species.name)
            : null;
        footerRight.textContent = speciesName
            ? `Species: ${speciesName}`
            : `Order: ${pokemon.order ?? "N/A"}`;
    }
}

// Search function to get user input and call getPokemon
function pokeSearch() {
    document
        .getElementById("pokeForm")
        .addEventListener("submit", async (e) => {
            e.preventDefault();

            // Get trimmed user input and elements we will update
            const rawInput = input.value;
            const uInput = rawInput ? rawInput.trim() : "";

            // Clear More Details (per your instruction we won't change its behavior beyond clearing old items)
            if (moreDetailsList) moreDetailsList.innerHTML = "";

            // -------------------------
            // Client-side validation
            // -------------------------
            // 1) Ensure input is not empty
            if (!uInput) {
                // Reset card and show helpful message
                resetCardToPlaceholder();
                if (nameEl)
                    nameEl.textContent =
                        "Please enter a Pokémon name or number.";
                applyBackgroundGradient([]);
                return;
            }

            // 2) If input is purely numeric, ensure it's a positive integer
            if (/^\d+$/.test(uInput)) {
                const id = Number(uInput);
                if (!Number.isInteger(id) || id <= 0) {
                    resetCardToPlaceholder();
                    if (nameEl)
                        nameEl.textContent =
                            "Please enter a positive integer for the Pokémon ID.";
                    applyBackgroundGradient([]);
                    return;
                }
            } else {
                // 3) If input is a name, allow letters, numbers, spaces, hyphens, periods and apostrophes.
                //    This excludes most special characters that would likely make the API lookup fail.
                //    (PokeAPI typically uses hyphens for variants like 'nidoran-f' / 'mr-mime' etc.)
                const validNameRegex = /^[a-zA-Z0-9\-\s.']+$/;
                if (!validNameRegex.test(uInput)) {
                    resetCardToPlaceholder();
                    if (nameEl)
                        nameEl.textContent =
                            "Name contains invalid characters. Use letters, numbers, spaces, hyphens, apostrophes, and periods only.";
                    applyBackgroundGradient([]);
                    return;
                }
            }

            // -------------------------
            // Attempt to fetch data
            // -------------------------
            try {
                // Call the fetch function which will throw on non-2xx responses
                const userPokemon = await getPokemon(uInput);

                // Populate visible card fields
                if (nameEl)
                    nameEl.innerHTML = `${capitalize(userPokemon.name)}`;
                if (idEl) idEl.textContent = `#${userPokemon.id}`;

                const types = userPokemon.types.map((t) => t.type.name);
                if (typeEl)
                    typeEl.innerHTML = types
                        .map(
                            (t) =>
                                `<span class="type-badge type-${t}">${t}</span>`
                        )
                        .join(" ");

                // Sprite (only set when fetch succeeded)
                if (spriteImg) {
                    spriteImg.src = userPokemon.sprites.front_default || "";
                    spriteImg.alt = userPokemon.name || "pokemon sprite";
                }

                // Background and card description/stats
                applyBackgroundGradient(types);
                populateMoreDetails(userPokemon);
                fillDescriptionAndStats(userPokemon);
            } catch (err) {
                // On fetch/API error, reset card to placeholders (do not try to set a sprite)
                resetCardToPlaceholder();
                if (nameEl) nameEl.textContent = `Error: ${err.message}`;
                console.error("Poké fetch error:", err);
                applyBackgroundGradient([]);
            }
        });
}

// Initialize card to placeholder state and wire up search
resetCardToPlaceholder();
pokeSearch();
