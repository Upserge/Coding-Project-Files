// Compact PokeDex script — only active code kept
const input = document.getElementById("userInput");
const body = document.body;
const moreDetailsList = document.getElementById("moreDetailsList");

// Card DOM refs
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

const PLACEHOLDERS = {
    name: "Pokemon Name",
    id: "#ID",
    typesHTML: `<span class="type-badge">—</span>`,
    desc: "Search for a Pokémon by name or number to see details here.",
    hp: "-", atk: "-", def: "-", baseExp: "—", footer: "", spriteAlt: "No image available"
};

const typeColors = {
    normal:["#A8A77A","#DAD7A0"],fire:["#FF9C54","#FFB86B"],water:["#4592C4","#79BFFF"],
    grass:["#9BCC50","#C7F48B"],electric:["#F7D02C","#FFF386"],ice:["#96D9D6","#DDF7F6"],
    fighting:["#C22E28","#E89A96"],poison:["#A33EA1","#CFA0D6"],ground:["#E2BF65","#F0D9A4"],
    flying:["#A98FF3","#D8C9FF"],psychic:["#F95587","#FFB3BF"],bug:["#A6B91A","#DFF08A"],
    rock:["#B6A136","#D9C69A"],ghost:["#735797","#B99ED8"],dragon:["#6F35FC","#A78BFF"],
    dark:["#705746","#A0897A"],steel:["#B7B7CE","#DCDCDF"],fairy:["#D685AD","#F6C7D9"]
};

function applyBackgroundGradient(types){
    body.style.transition="background 450ms ease";
    if(!types || types.length===0){ body.style.background=""; return; }
    const normalized = types.map(t => (typeof t==="string"? t : t.type?.name)).filter(Boolean);
    const c1 = typeColors[normalized[0]]?.[0];
    const c2 = normalized[1] ? typeColors[normalized[1]]?.[0] : typeColors[normalized[0]]?.[1];
    if(c1 && c2) body.style.background = `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
    else if(c1) body.style.background = c1;
    else body.style.background = "";
}

function capitalize(s){ return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
function isUrl(s){ return typeof s==="string" && /^https?:\/\//i.test(s); }

function resetCardToPlaceholder(){
    if(nameEl) nameEl.textContent = PLACEHOLDERS.name;
    if(idEl) idEl.textContent = PLACEHOLDERS.id;
    if(typeEl) typeEl.innerHTML = PLACEHOLDERS.typesHTML;
    if(descEl) descEl.textContent = PLACEHOLDERS.desc;
    function setStat(el,val,label){ if(!el) return; el.querySelector("strong").textContent = val; el.querySelector("small").textContent = label; el.style.opacity="0.6"; }
    setStat(statHPEl, PLACEHOLDERS.hp, "HP"); setStat(statAtkEl, PLACEHOLDERS.atk, "Attack"); setStat(statDefEl, PLACEHOLDERS.def, "Defense");
    if(baseExpEl) baseExpEl.textContent = PLACEHOLDERS.baseExp;
    if(footerRight) footerRight.textContent = PLACEHOLDERS.footer;
    if(spriteImg){ spriteImg.src = ""; spriteImg.alt = PLACEHOLDERS.spriteAlt; }
    applyBackgroundGradient([]);
}

// Humanize values for readable display
function humanizeField(key, value){
    if(value===null||value===undefined) return "None";
    if(Array.isArray(value)){
        if(value.length===0) return "None";
        const list = value.map(item => {
            if(!item) return null;
            if(typeof item === "string" || typeof item === "number") return String(item);
            if(item.ability?.name) return item.ability.name.replace(/-/g," ");
            if(item.move?.name) return item.move.name.replace(/-/g," ");
            if(item.item?.name) return item.item.name.replace(/-/g," ");
            if(item.version?.name) return item.version.name;
            if(item.name) return item.name;
            if(item.url) return item.url;
            return null;
        }).filter(Boolean);
        const uniq = [...new Set(list)];
        return uniq.length<=8 ? uniq.map(capitalize).join(", ") : uniq.slice(0,8).map(capitalize).join(", ") + `, and ${uniq.length-8} more`;
    }
    if(typeof value === "object"){
        if(value.name) return capitalize(value.name);
        if(value.url) return value.url;
        const keys = Object.keys(value).filter(k => typeof value[k] === "string" || typeof value[k] === "number");
        if(keys.length) return keys.map(k => `${capitalize(k)}: ${value[k]}`).join("; ");
        return "See details";
    }
    return String(value);
}

// Build More Details panel (readable + expandable)
function populateMoreDetails(pokemonObj){
    const list = moreDetailsList;
    if(!list) return;
    list.innerHTML = "";
    if(!pokemonObj || typeof pokemonObj !== "object"){ list.appendChild(Object.assign(document.createElement("li"),{textContent:"No extra details available."})); return; }

    const skipKeys = new Set(["name","id","types","sprites","stats","height","weight","base_experience","species","order","abilities","held_items","is_default","past_abilities","past_types"]);
    Object.keys(pokemonObj).sort().forEach(key=>{
        if(skipKeys.has(key)) return;
        const value = pokemonObj[key];
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.className="detail-toggle"; btn.type="button"; btn.setAttribute("aria-expanded","false");
        const title = document.createElement("span"); title.textContent = capitalize(key.replace(/_/g," "));
        const summary = document.createElement("span"); summary.className="detail-summary";
        summary.textContent = (key==="moves" && Array.isArray(value)) ? `${value.length} move${value.length===1?"":"s"}` : humanizeField(key,value);
        const chevron = document.createElement("span"); chevron.className="detail-chevron"; chevron.textContent="›";
        btn.append(title, summary, chevron);
        const content = document.createElement("div"); content.className="detail-content";

        if(key==="moves" && Array.isArray(value)){
            const movesList = document.createElement("ul"); movesList.style.paddingLeft="18px";
            value.forEach(moveItem=>{
                const itemLi = document.createElement("li"); itemLi.style.marginBottom="8px";
                const moveName = moveItem?.move?.name ? capitalize(moveItem.move.name.replace(/-/g," ")) : humanizeField(key,moveItem);
                const titleDiv = document.createElement("div"); titleDiv.style.fontWeight="700"; titleDiv.textContent = moveName; itemLi.appendChild(titleDiv);
                const details = moveItem?.version_group_details;
                if(Array.isArray(details) && details.length){
                    const metaEntries = details.map(d=>{
                        const method = d.move_learn_method?.name?.replace(/-/g," ")||""
                        const lvl = typeof d.level_learned_at === "number" ? d.level_learned_at : null;
                        const vg = d.version_group?.name?.replace(/-/g," ")||"";
                        let entry = method;
                        if(lvl !== null && lvl !== 0) entry += ` @${lvl}`;
                        if(vg) entry += ` (${vg})`;
                        return entry.trim();
                    }).filter(Boolean);
                    const uniqMeta = [...new Set(metaEntries)];
                    const metaText = uniqMeta.length<=4 ? uniqMeta.join("; ") : uniqMeta.slice(0,4).join("; ") + `, and ${uniqMeta.length-4} more`;
                    const metaDiv = document.createElement("div"); metaDiv.style.fontSize="0.85rem"; metaDiv.style.color="#444"; metaDiv.style.marginTop="4px"; metaDiv.textContent = metaText;
                    itemLi.appendChild(metaDiv);
                }
                movesList.appendChild(itemLi);
            });
            content.appendChild(movesList);
        } else if(Array.isArray(value)){
            const innerList = document.createElement("ul");
            value.forEach(item=>{
                const itemLi = document.createElement("li");
                if(isUrl(item)){ const a=document.createElement("a"); a.href=item; a.target="_blank"; a.rel="noopener noreferrer"; a.textContent=item; itemLi.appendChild(a); }
                else itemLi.textContent = humanizeField(key,item);
                innerList.appendChild(itemLi);
            });
            content.appendChild(innerList);
        } else if(typeof value === "object" && value !== null){
            const subPairs = document.createElement("div");
            Object.keys(value).forEach(subKey=>{
                const val = value[subKey];
                const p = document.createElement("p"); p.style.margin="4px 0";
                if(isUrl(val)){ const a=document.createElement("a"); a.href=val; a.target="_blank"; a.rel="noopener noreferrer"; a.textContent = val; p.textContent = `${capitalize(subKey.replace(/_/g," "))}: `; p.appendChild(a); }
                else p.textContent = `${capitalize(subKey.replace(/_/g," "))}: ${humanizeField(subKey,val)}`;
                subPairs.appendChild(p);
            });
            content.appendChild(subPairs);
        } else {
            if(key==="location_area_encounters" && isUrl(value)){
                const a=document.createElement("a"); a.href=value; a.target="_blank"; a.rel="noopener noreferrer"; a.textContent="Open encounters"; content.appendChild(a);
            } else if(key==="cries" && isUrl(value)){
                const a=document.createElement("a"); a.href=value; a.target="_blank"; a.rel="noopener noreferrer"; a.textContent="Play cry / Open resource"; content.appendChild(a);
            } else { const p=document.createElement("p"); p.style.margin="0"; p.textContent = humanizeField(key,value); content.appendChild(p); }
        }

        btn.addEventListener("click", ()=>{ const expanded = btn.getAttribute("aria-expanded")==="true"; btn.setAttribute("aria-expanded",String(!expanded)); content.style.display = expanded ? "none" : "block"; });
        li.appendChild(btn); li.appendChild(content); list.appendChild(li);
    });

    if(list.children.length===0){ const li=document.createElement("li"); li.textContent="No additional details available."; list.appendChild(li); }
}

async function getPokemon(nameOrId){
    const url = (typeof nameOrId === "string" && isNaN(nameOrId)) ? `https://pokeapi.co/api/v2/pokemon/${nameOrId.toLowerCase()}` : `https://pokeapi.co/api/v2/pokemon/${nameOrId}`;
    const response = await fetch(url);
    if(!response.ok) throw new Error(response.status===404 ? "Pokemon not found. Check the name or number and try again." : `Failed to fetch Pokémon (status ${response.status}).`);
    return await response.json();
}

function fillDescriptionAndStats(pokemon){
    const types = (pokemon.types||[]).map(t=>t.type?.name).filter(Boolean);
    const typeText = types.length ? types.map(capitalize).join(" / ") : "Unknown type";
    const heightMeters = pokemon.height ? (pokemon.height/10).toFixed(1) : "?.?";
    const weightKg = pokemon.weight ? (pokemon.weight/10).toFixed(1) : "?.?";
    const abilities = (pokemon.abilities||[]).map(a => { const n = a.ability?.name? a.ability.name.replace(/-/g," "): String(a.ability?.name||""); return a.is_hidden ? `${capitalize(n)} (Hidden)` : capitalize(n); });
    if(descEl) descEl.textContent = `${capitalize(pokemon.name)} — ${typeText} Pokémon. Height: ${heightMeters} m · Weight: ${weightKg} kg. Abilities: ${abilities.length?abilities.join(", "):"None"}.`;

    const statsMap = {}; (pokemon.stats||[]).forEach(s => { const k = s.stat?.name; if(k) statsMap[k.toLowerCase()] = s.base_stat; });
    const hp = statsMap["hp"] ?? null, atk = statsMap["attack"] ?? null, def = statsMap["defense"] ?? null;
    function setStatBlock(id, value, label){ const el = document.getElementById(id); if(!el) return; const strong = el.querySelector("strong"), small = el.querySelector("small"); if(value!==null && value!==undefined){ if(strong) strong.textContent = String(value); if(small) small.textContent = label; el.style.opacity="1"; } else { if(strong) strong.textContent = "-"; if(small) small.textContent = label; el.style.opacity="0.6"; } }
    setStatBlock("statHP", hp, "HP"); setStatBlock("statAtk", atk, "Attack"); setStatBlock("statDef", def, "Defense");
    if(baseExpEl) baseExpEl.textContent = String(pokemon.base_experience ?? "N/A");
    if(footerRight) footerRight.textContent = pokemon.species?.name ? `Species: ${capitalize(pokemon.species.name)}` : `Order: ${pokemon.order ?? "N/A"}`;
}

function pokeSearch(){
    document.getElementById("pokeForm").addEventListener("submit", async (e)=>{
        e.preventDefault();
        const rawInput = input.value; const uInput = rawInput ? rawInput.trim() : "";
        if(moreDetailsList) moreDetailsList.innerHTML = "";
        if(!uInput){ resetCardToPlaceholder(); if(nameEl) nameEl.textContent = "Please enter a Pokémon name or number."; applyBackgroundGradient([]); return; }
        if(/^\d+$/.test(uInput)){ const id = Number(uInput); if(!Number.isInteger(id)||id<=0){ resetCardToPlaceholder(); if(nameEl) nameEl.textContent = "Please enter a positive integer for the Pokémon ID."; applyBackgroundGradient([]); return; } }
        else { const validNameRegex = /^[a-zA-Z0-9\-\s.']+$/; if(!validNameRegex.test(uInput)){ resetCardToPlaceholder(); if(nameEl) nameEl.textContent = "Name contains invalid characters. Use letters, numbers, spaces, hyphens, apostrophes, and periods only."; applyBackgroundGradient([]); return; } }

        try{
            const userPokemon = await getPokemon(uInput);
            if(nameEl) nameEl.textContent = capitalize(userPokemon.name);
            if(idEl) idEl.textContent = `#${userPokemon.id}`;
            const types = userPokemon.types.map(t=>t.type.name);
            if(typeEl) typeEl.innerHTML = types.map(t=>`<span class="type-badge type-${t}">${t}</span>`).join(" ");
            if(spriteImg){ spriteImg.src = userPokemon.sprites.front_default || ""; spriteImg.alt = userPokemon.name || "pokemon sprite"; }
            applyBackgroundGradient(types);
            populateMoreDetails(userPokemon);
            fillDescriptionAndStats(userPokemon);
        } catch(err){
            resetCardToPlaceholder();
            if(nameEl) nameEl.textContent = `Error: ${err.message}`;
            console.error("Poké fetch error:", err);
            applyBackgroundGradient([]);
        }
    });
}

resetCardToPlaceholder();
pokeSearch();
