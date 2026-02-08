
// https://play.pokemonshowdown.com/data/

const searchReplaceRegex = /[-() %.:'♀♂]/gi;

let pokemonNameInput, table, noMatchRow, pastCheckbox, futureCheckbox;
let dropdownTemplate;
let searchTypes1 = [];
let searchTypes2 = [];
let searchAbilities = [];
let searchMoves1 = [];
let searchMoves2 = [];
let searchMoves3 = [];
let searchMoves4 = [];
let atLeastXMoves = [];
let atLeastXNumber = 1;
let pokemonSearchTerm = '';
let includePast = false;
let includeFuture = false;

let pokemonData, moveData, learnsets, abilityData, typeData;

function createSelectedPill(item, onClick) {
    const pill = document.createElement('span');
    pill.classList.add('selected-pill');
    pill.innerText = item.value || item;

    pill.addEventListener('click', onClick);

    return pill;
}

function createDropdown(options, title, onSelect, classes) {
    const dropdownContainer = document.importNode(dropdownTemplate.content, true).children[0];
    const titleElement = dropdownContainer.querySelector('.dropdown-title');
    const selectedOptionsContainer = dropdownContainer.querySelector('.selected-options');
    const input = dropdownContainer.querySelector('input');
    const dropdownMenu = dropdownContainer.querySelector('.dropdown-menu');
    const itemData = [];
    let dropdownMenuSelectedIndex = -1;

    titleElement.innerText = title;

    if(Array.isArray(classes)) classes.forEach(c => dropdownContainer.classList.add(c));
    
    const noResultsEl = document.createElement('div');
    noResultsEl.innerText = 'No Matching Results';
    noResultsEl.classList.add('no-match', 'removed');
    dropdownMenu.append(noResultsEl);

    options.forEach(option => {
        let el = document.createElement('div');
        el.innerText = option.label || option.value || option;
        
        const item = {
            el,
            label: option.label || option,
            value: (option.value || option),
            id: (option.value || option).trim().toLowerCase().replaceAll(searchReplaceRegex, ''),
            selected: false
        };

        el.addEventListener('click', () => {
            item.selected = !item.selected;

            if(item.selected) {
                const pill = createSelectedPill(item.label, () => {
                    item.selected = false;
                    item.el.classList.remove('selected');
                    pill.remove();
                    
                    if(typeof onSelect === 'function') onSelect((option.value || option), false);
                });

                selectedOptionsContainer.append(pill);
                item.pill = pill;
                item.el.classList.add('selected');
            } else {
                item.pill.remove();
                item.el.classList.remove('selected');
            }

            if(typeof onSelect === 'function') onSelect((option.value || option), item.selected);
        });

        // el.data = item;
        dropdownMenu.append(el);
        
        itemData.push(item);
    });

    input.addEventListener('focus', () => dropdownMenu.classList.remove('removed'));
    input.addEventListener('input', () => {

        dropdownMenuSelectedIndex = -1;
        dropdownMenu.classList.remove('removed');

        let searchText = input.value.trim().toLowerCase().replaceAll(searchReplaceRegex, '');

        let empty = true;

        if(searchText) {
            itemData.forEach(item => {
                if(item.id.includes(searchText)) {
                    item.el.classList.remove('removed');
                    empty = false;
                } else {
                    item.el.classList.add('removed');
                }
            });
        } else {
            itemData.forEach(item => item.el.classList.remove('removed'));

            if (itemData.length) empty = false;
        }

        if(empty) {
            noResultsEl.classList.remove('removed');
        } else {
            noResultsEl.classList.add('removed');
        }
    });
    
    input.addEventListener('keydown', e => {
        const menuItems = dropdownMenu.querySelectorAll(':not(.removed)');
    
        if(e.key === 'ArrowDown') {
            e.preventDefault();
            if(dropdownMenuSelectedIndex !== -1) {
                menuItems[dropdownMenuSelectedIndex].classList.remove('highlighted');
            }
    
            dropdownMenuSelectedIndex++;
            
            if(dropdownMenuSelectedIndex >= menuItems.length) {
                dropdownMenuSelectedIndex = 0;
            }
    
            menuItems[dropdownMenuSelectedIndex].classList.add('highlighted');
        } else if(e.key === 'ArrowUp') {
            e.preventDefault();
            if(dropdownMenuSelectedIndex !== -1) {
                menuItems[dropdownMenuSelectedIndex].classList.remove('highlighted');
            }
    
            dropdownMenuSelectedIndex--;
    
            if(dropdownMenuSelectedIndex < 0) {
                dropdownMenuSelectedIndex = menuItems.length - 1;
            }
    
            menuItems[dropdownMenuSelectedIndex].classList.add('highlighted');
        } else if(e.key === 'Enter') {
            menuItems[dropdownMenuSelectedIndex]?.click?.();
        } else if(e.key === 'Tab') {
            if(!menuItems[dropdownMenuSelectedIndex]?.classList?.contains?.('selected')) {
                menuItems[dropdownMenuSelectedIndex]?.click?.();
            }
            dropdownMenu.classList.add('removed');
            dropdownMenuSelectedIndex = -1;
        }
    });

    window.addEventListener('click', (event) => {
        const targetPath = Array.from(event.composedPath());

        if(!targetPath.includes(dropdownContainer)) {
            dropdownMenu.classList.add('removed');
            dropdownMenuSelectedIndex = -1;
        }
    });

    return { el: dropdownContainer, items: itemData };
}

Promise.all(
    [
        new Promise(resolve => {
            window.onload = () => {
                dropdownTemplate = document.querySelector('#dropdown-template');
                table = document.querySelector('#table');
                pokemonNameInput = document.querySelector('#pokemon-name-search');
                pastCheckbox = document.querySelector('#past-checkbox');
                futureCheckbox = document.querySelector('#future-checkbox');
                noMatchRow = document.querySelector('#no-match-row');

                resolve();
            }
        }),
        fetch('./data/pokedex.json').then(r => r.json()).then(r => pokemonData = r),
        fetch('./data/moves.json').then(r => r.json()).then(r => moveData = r),
        fetch('./data/learnsets.json').then(r => r.json()).then(r => learnsets = r),
        fetch('./data/abilities.json').then(r => r.json()).then(r => abilityData = r),
        fetch('./data/typeEffectiveness.json').then(r => r.json()).then(r => typeData = r),
    ]
).then(init);

function init() {
    Object.keys(pokemonData).forEach(p => {
        let nonstandard = pokemonData[p].isNonstandard;
        if(nonstandard) {
            if(nonstandard === 'Past') {
                pokemonData[p].past = true;
            } else if(nonstandard === 'Future') {
                pokemonData[p].future = true;
            } else {
                return delete pokemonData[p];
            }
        }

        let baseSpecies = pokemonData[p].baseSpecies;

        if(baseSpecies) {
            let basePokemon = Object.entries(pokemonData).find(([ baseId, x ]) => x.name === baseSpecies);

            if(!basePokemon) {
                console.log('couldn\'t find base pokemon', baseSpecies, 'for', p, pokemonData[p]);
            } else {
                learnsets[p] = learnsets[p]?.learnset ? learnsets[p] : {learnset: {...(learnsets[basePokemon[0]].learnset || {})}};
            }
        }
        
        if(!learnsets[p] || !pokemonData[p].types || !pokemonData[p].baseStats || !pokemonData[p].abilities || pokemonData[p].forme === 'Gmax') {
            return delete pokemonData[p];
        }

        pokemonData[p].searchId = pokemonData[p].name.toLowerCase().replaceAll(searchReplaceRegex, '').replaceAll(/é|é/g, 'e');
    });

    Object.keys(learnsets).forEach(l => {
        if(!learnsets[l].learnset) {
            console.log('deleting', pokemonData[l]?.num, l, 'because no learnset.learnset', learnsets[l])
            delete pokemonData[l];
            return delete learnsets[l];
        }

        let learnset = learnsets[l].learnset;

        Object.keys(learnset).forEach(move => {
            if(typeof learnset[move]?.some !== 'function') return console.log('fuck you', l, learnset);
            if(!learnset[move].some(x => x.startsWith('9'))) {  // needs to be updated for generation in future, should probably make configurable by user onpage
                delete learnset[move];
            } else {
                learnset[move] = 'self';
            }
        });
        
        learnsets[l] = learnset;
    });

    Object.keys(pokemonData).forEach(id => {
        let pokemon = pokemonData[id];
        if(pokemon.prevo) {
            let prevo = Object.entries(pokemonData).find(([prevoId, x]) => x.name === pokemon.prevo);
            
            if(!prevo) {
                return console.log('couldn\'t find prevo', pokemon.prevo, 'for', id, pokemon);
            }

            let pokemonLearnset = learnsets[id];
            let prevoLearnset = learnsets[prevo[0]];

            if(!pokemonLearnset) {
                return console.log('couldn\'t find learnset for pokemon', id, pokemon);
            }

            if(!prevoLearnset) {
                return console.log('couldn\'t find learnset for prevo', prevo);
            }

            Object.keys(prevoLearnset).forEach(k => pokemonLearnset[k] = pokemonLearnset[k] || 'prevo');
        }
    });

    pokemonNameInput.addEventListener('input', e => {
        pokemonSearchTerm = pokemonNameInput.value.toLowerCase().replaceAll(searchReplaceRegex, '').replaceAll(/é|é/g, 'e');;
        updateMatchingPokemon();
    });

    const moveOptions = Object.entries(moveData).filter(([ _, data ]) => !data.isNonstandard).map(([id, data]) => ({value: id, label: data.name}));
    const abilityOptions = Object.entries(abilityData).filter(([ _, data ]) => !data.isNonstandard).map(([id, data]) => ({value: data.name, label: data.name}));
    const typeOptions = Object.keys(typeData).map(x => ({label: x.substr(0, 1).toUpperCase() + x.substr(1), value: x.substr(0, 1).toUpperCase() + x.substr(1)}));;

    const move1Dropdown = createDropdown(moveOptions, 'Move 1', () => {
        searchMoves1 = move1Dropdown.items.filter(x => x.selected).map(x => x.value);
        updateMatchingPokemon();
    });

    const move2Dropdown = createDropdown(moveOptions, 'Move 2', () => {
        searchMoves2 = move2Dropdown.items.filter(x => x.selected).map(x => x.value);
        updateMatchingPokemon();
    });

    const move3Dropdown = createDropdown(moveOptions, 'Move 3', () => {
        searchMoves3 = move3Dropdown.items.filter(x => x.selected).map(x => x.value);
        updateMatchingPokemon();
    });

    const move4Dropdown = createDropdown(moveOptions, 'Move 4', () => {
        searchMoves4 = move4Dropdown.items.filter(x => x.selected).map(x => x.value);
        updateMatchingPokemon();
    });

    const abilityDropdown = createDropdown(abilityOptions, 'Ability', () => {
        searchAbilities = abilityDropdown.items.filter(x => x.selected).map(x => x.value);
        updateMatchingPokemon();
    });

    const type1Dropdown = createDropdown(typeOptions, 'Type 1', () => {
        searchTypes1 = type1Dropdown.items.filter(x => x.selected).map(x => x.value);
        updateMatchingPokemon();
    });

    const type2Dropdown = createDropdown(typeOptions, 'Type 2', () => {
        searchTypes2 = type2Dropdown.items.filter(x => x.selected).map(x => x.value);
        updateMatchingPokemon();
    });
    
    const atLeastXMoveDropdown = createDropdown(moveOptions, 'At Least', () => {
        atLeastXMoves = atLeastXMoveDropdown.items.filter(x => x.selected).map(x => x.value);
        updateMatchingPokemon();
    });

    const atLeastTitle = atLeastXMoveDropdown.el.querySelector('.dropdown-title');
    const atLeastXInput = document.createElement('input');
    
    atLeastXInput.type = 'number';
    atLeastXInput.min = 0;
    atLeastXInput.max = 4;
    atLeastXInput.placeholder = '...';
    atLeastXInput.value = atLeastXNumber;
    atLeastXInput.addEventListener('input', () => {
        if (!Number.isNaN(+atLeastXInput.value) && +atLeastXInput.value >= 0) {
            atLeastXNumber = +atLeastXInput.value;
            updateMatchingPokemon();
        }
    });
    atLeastXInput.addEventListener('blur', () => {
        if (!atLeastXInput.value) {
            atLeastXInput.value = 0;
            if (atLeastXNumber !== 0) {
                atLeastXNumber = 0;
                updateMatchingPokemon();
            }
        }
    });

    atLeastXInput.classList.add('at-least-input');
    atLeastTitle.append(atLeastXInput);

    document.body.querySelector('.row.moves').append(move1Dropdown.el);
    document.body.querySelector('.row.moves').append(move2Dropdown.el);
    document.body.querySelector('.row.moves').append(move3Dropdown.el);
    document.body.querySelector('.row.moves').append(move4Dropdown.el);
    document.body.querySelector('.row.moves').append(atLeastXMoveDropdown.el);
    document.body.querySelector('.row.other').append(abilityDropdown.el);
    document.body.querySelector('.row.other').append(type1Dropdown.el);
    document.body.querySelector('.row.other').append(type2Dropdown.el);

    // Object.values(pokemonData).sort((a,b) => a.name.localeCompare(b.name)).forEach(addRow);
    Object.values(pokemonData).forEach(addRow);

    pastCheckbox.addEventListener('input', updatePast);
    futureCheckbox.addEventListener('input', updateFuture);

    window.learnsets = learnsets;
    window.pokemon = pokemonData;

    updateMatchingPokemon();
}

function updateMatchingPokemon() {
    let anyResults = false;
    
    Object.entries(pokemonData).forEach(([id, pokemon], index) => {
        // if(pokemon.past) return pokemon.el.classList.add('removed');
        const learnset = learnsets[id];

        if(!learnset) {
            return console.log('no learnset', id, pokemon);
        }

        if(!pokemon.el) {
            return console.log('no row element', id, pokemon);
        }

        if(pokemonSearchTerm && !pokemon.searchId.includes(pokemonSearchTerm)) {
            return pokemon.el.classList.add('removed');
        }

        if(searchMoves1.length && !searchMoves1.some(m => learnset[m])) {
            return pokemon.el.classList.add('removed');
        }

        if(searchMoves2.length && !searchMoves2.some(m => learnset[m])) {
            return pokemon.el.classList.add('removed');
        }

        if(searchMoves3.length && !searchMoves3.some(m => learnset[m])) {
            return pokemon.el.classList.add('removed');
        }

        if(searchMoves4.length && !searchMoves4.some(m => learnset[m])) {
            return pokemon.el.classList.add('removed');
        }

        if(searchTypes1.length && !searchTypes1.some(t => pokemon.types.some(x => t === x))) {
            return pokemon.el.classList.add('removed');
        }

        if(searchTypes2.length && !searchTypes2.some(t => pokemon.types.some(x => t === x))) {
            return pokemon.el.classList.add('removed');
        }

        if(searchAbilities.length && !searchAbilities.some(a => Object.values(pokemon.abilities).some(x => a === x))) {
            return pokemon.el.classList.add('removed');
        }

        if(!includePast && pokemon.isNonstandard === 'Past') {
            return pokemon.el.classList.add('removed'); 
        }

        if(!includeFuture && pokemon.isNonstandard === 'Future') {
            return pokemon.el.classList.add('removed'); 
        }

        if(atLeastXNumber && atLeastXMoves.length >= atLeastXNumber) {
            let matchesCount = 0;

            Object.keys(learnset).forEach(m => atLeastXMoves.includes(m) ? matchesCount++ : null);
            
            if (matchesCount < atLeastXNumber) {
                return pokemon.el.classList.add('removed');
            }
        }

        pokemon.el.classList.remove('removed');
        anyResults = true;
    });

    if(!anyResults) {
        noMatchRow.classList.remove('removed');
    } else {
        noMatchRow.classList.add('removed');
    }
}

function updatePast() {
    includePast = pastCheckbox.checked;

    updateMatchingPokemon();
}

function updateFuture() {
    includeFuture = futureCheckbox.checked;

    updateMatchingPokemon();
}

function addRow(pokemon) {
    if(!pokemon.types || !pokemon.baseStats || !pokemon.abilities) {
        console.log('nope', pokemon);
        return;
    }
    let row = document.createElement('tr');

    addCell(row, pokemon.num, 'number');
    addCell(row, pokemon.name, 'name');
    addCell(row, pokemon.types.join(', '), 'type');
    addCell(row, Object.values(pokemon.abilities).join(', '), 'ability');
    // addCell(row, Object.entries(pokemon.abilities).filter(([key, _]) => key !== 'H').map(([_, ability]) => ability).join(', '), 'ability');
    // addCell(row, pokemon.abilities['H'], 'ability');
    addCell(row, pokemon.baseStats.hp, 'stat');
    addCell(row, pokemon.baseStats.atk, 'stat');
    addCell(row, pokemon.baseStats.def, 'stat');
    addCell(row, pokemon.baseStats.spa, 'stat');
    addCell(row, pokemon.baseStats.spd, 'stat');
    addCell(row, pokemon.baseStats.spe, 'stat');

    pokemon.el = row;

    table.append(row);
}

function addCell(rowElement, content, className) {
    const element = document.createElement('td');

    element.innerText = content;
    element.title = content;

    if(className) {
        element.classList.add(className);
    }

    rowElement.append(element);

    return element;
}
