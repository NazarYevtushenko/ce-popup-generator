const template = `<div class="popup" style="text-align: left; display: inline-block; font-family: 'Montserrat', sans-serif; background-color: #292935; border-radius: 12px; max-width: 400px; box-shadow: 0 20px 40px rgba(0,0,0,0.6); position: relative; font-size: 14px; padding: 0; overflow: hidden;"><div style="text-align: center;"><img src="[IMG LINK]" alt="Promo" style="width: 100%; height: auto; display: block;"></div><div style="padding: 25px 25px 35px 25px; color: #ffffff; text-align: left;"><p style="margin: 0 0 10px 0; font-size: 14px; color: #e0e0e0; font-weight: 600;">[SUB HEADLINE]</p><h2 style="margin: 0 0 15px 0; font-family: 'Bebas Neue Pro', sans-serif; font-size: 34px; line-height: 1.1; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; color: #ffffff;">[HEADLINE]</h2><p style="margin: 0 0 30px 0; font-size: 15px; line-height: 1.6; color: #d0d0d0;">[MAIN TEXT]</p>[CTA_BLOCK]</div></div><style>#modal-title { display: none !important; } #modal-background { background: none !important; text-align: center; }</style>`;
const ctaSubTemplate = `<a href="[LINK]" target="_blank" style="text-decoration: none; display: block;"><span style="display: block; width: 100%; background: linear-gradient(90deg, #1CFF47 0%, #25BD95 100%); color: #000000; padding: 16px 0; font-weight: 800; font-family: 'Montserrat', sans-serif; font-size: 18px; border-radius: 6px; text-align: center; text-transform: uppercase; box-shadow: 0 10px 20px -5px rgba(28, 255, 71, 0.4);">[BUTTON TEXT]</span></a>`;

const fields = ['img', 'sub', 'head', 'main', 'btn', 'link'];
let historyStack = [];
let isProcessing = false;
let currentView = 'grid';

// --- БИБЛИОТЕКА ---
function toggleView(view) {
    currentView = view;
    document.getElementById('btn-grid').classList.toggle('active', view === 'grid');
    document.getElementById('btn-list').classList.toggle('active', view === 'list');
    loadSharedAssets();
}

function loadSharedAssets() {
    assetsRef.on('value', (snapshot) => {
        const display = document.getElementById('assets-display');
        const data = snapshot.val();
        display.innerHTML = '';

        if (data) {
            const folders = {};
            // Группируем данные
            Object.keys(data).forEach(key => {
                const item = data[key];
                const fName = item.folder || 'Общие';
                if (!folders[fName]) folders[fName] = [];
                folders[fName].push({ ...item, key });
            });

            // Рендерим папки
            Object.keys(folders).forEach(fName => {
                const folderGroup = document.createElement('div');
                folderGroup.className = 'folder-group';
                
                // Заголовок папки (как в проводнике)
                const header = document.createElement('div');
                header.className = 'folder-header';
                header.innerHTML = `
                    <span class="folder-icon">📂</span>
                    <span class="folder-title">${fName}</span>
                    <span style="font-size: 10px; color: #999;">(${folders[fName].length})</span>
                `;
                
                // Логика открытия/закрытия
                header.onclick = () => {
                    folderGroup.classList.toggle('open');
                };

                const content = document.createElement('div');
                content.className = 'folder-content';
                content.className += currentView === 'grid' ? ' assets-grid' : ' assets-list';

                folders[fName].forEach(item => {
                    const div = document.createElement('div');
                    if (currentView === 'grid') {
                        div.className = 'asset-item';
                        div.innerHTML = `<img src="${item.url}">`;
                    } else {
                        div.className = 'asset-list-item';
                        div.innerHTML = `<img src="${item.url}"> <span>${item.name}</span>`;
                    }
                    
                    div.onclick = (e) => {
                        e.stopPropagation(); // Чтобы папка не закрылась при выборе файла
                        document.getElementById('img').value = item.url;
                        generate();
                    };
                    
                    div.oncontextmenu = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if(confirm('Удалить этот ассет?')) assetsRef.child(item.key).remove();
                    };
                    
                    content.appendChild(div);
                });

                folderGroup.appendChild(header);
                folderGroup.appendChild(content);
                display.appendChild(folderGroup);
            });
        }
    });
}

function addAssetToCloud() {
    const url = document.getElementById('img').value;
    const name = document.getElementById('asset-name').value;
    const folder = document.getElementById('asset-folder').value || 'Общие';
    if (url && name) {
        assetsRef.push({ name, url, folder });
        document.getElementById('asset-name').value = '';
        document.getElementById('asset-folder').value = '';
    }
}

// --- РЕДАКТОР ---
function generate(skipHistory = false) {
    const ctaEnabled = document.getElementById('cta-toggle').checked;
    let ctaHtml = ctaEnabled ? ctaSubTemplate.replaceAll("[LINK]", document.getElementById('link').value || '#').replaceAll("[BUTTON TEXT]", document.getElementById('btn').value || 'JOIN NOW') : "";
    let res = template
        .replaceAll("[IMG LINK]", document.getElementById('img').value || 'https://via.placeholder.com/400x200/292935/ffffff?text=OlyBet')
        .replaceAll("[SUB HEADLINE]", document.getElementById('sub').value || 'SUB HEADLINE')
        .replaceAll("[HEADLINE]", document.getElementById('head').value || 'MAIN HEADLINE')
        .replaceAll("[MAIN TEXT]", document.getElementById('main').value.replace(/\n/g, '<br>') || 'Description...')
        .replaceAll("[CTA_BLOCK]", ctaHtml);
    document.getElementById('output-code').value = res;
    document.getElementById('preview-box').innerHTML = res;
    if (!isProcessing && !skipHistory) {
        clearTimeout(window.saveTimeout);
        window.saveTimeout = setTimeout(saveState, 500);
    }
}

function saveState() {
    if (isProcessing) return;
    const state = {};
    fields.forEach(id => state[id] = document.getElementById(id).value);
    state.cta = document.getElementById('cta-toggle').checked;
    historyStack.push(state);
    if (historyStack.length > 50) historyStack.shift();
}

function undo() {
    if (historyStack.length > 1) {
        historyStack.pop();
        const last = historyStack[historyStack.length-1];
        isProcessing = true;
        fields.forEach(id => document.getElementById(id).value = last[id]);
        document.getElementById('cta-toggle').checked = last.cta;
        generate(true);
        isProcessing = false;
    }
}

function importHTML() {
    const raw = document.getElementById('import-html').value;
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    try {
        isProcessing = true;
        document.getElementById('img').value = doc.querySelector('img')?.getAttribute('src') || "";
        document.getElementById('sub').value = doc.querySelector('p[style*="font-weight: 600"]')?.innerText || "";
        document.getElementById('head').value = doc.querySelector('h2')?.innerText || "";
        document.getElementById('main').value = (doc.querySelector('p[style*="line-height: 1.6"]')?.innerHTML || "").replace(/<br\s*[\/]?>/gi, "\n").trim();
        const btn = doc.querySelector('span[style*="text-transform: uppercase"]');
        document.getElementById('cta-toggle').checked = !!btn;
        document.getElementById('btn').value = btn?.innerText || "";
        document.getElementById('link').value = doc.querySelector('a')?.getAttribute('href') || "";
        isProcessing = false;
        saveState(); generate();
    } catch(e) { alert("Ошибка импорта"); isProcessing = false; }
}

function copyCode() {
    const out = document.getElementById("output-code");
    out.select();
    document.execCommand("copy");
    document.querySelector('.copy-btn').innerText = "УСПЕШНО СКОПИРОВАНО!";
    setTimeout(() => { document.querySelector('.copy-btn').innerText = "СКОПИРОВАТЬ НОВЫЙ КОД"; }, 1500);
}

window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyB' && document.activeElement.id === 'main') {
        e.preventDefault();
        const el = document.getElementById('main');
        const s = el.selectionStart, end = el.selectionEnd, txt = el.value;
        el.value = txt.substring(0, s) + '<strong>' + txt.substring(s, end) + '</strong>' + txt.substring(end);
        generate();
    }
});


window.onload = () => { loadSharedAssets(); generate(); };
