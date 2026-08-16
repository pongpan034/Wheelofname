/**
 * Classroom Wheel of Names - Core Application
 * ออกแบบเพื่อการเรียนการสอนในห้องเรียน แสดงผลบนทีวีและโปรเจกเตอร์ได้คมชัด
 */

// ==========================================
// 1. DEFAULT DATA & COLOR PALETTE
// ==========================================
const DEFAULT_CLASS_ID = 'class_default';

const DEFAULT_NAMES = [
    'ด.ช. กิตติศักดิ์ เจริญดี',
    'ด.ญ. ฐิตินันท์ สุขุม',
    'ด.ช. ธนกร พงศ์ประเสริฐ',
    'ด.ญ. นภัสสร วงศ์สุวรรณ',
    'ด.ช. ปวริศ เกียรติอนันต์',
    'ด.ญ. พิชญา ศรีสมบูรณ์',
    'ด.ช. ภานุวัฒน์ เดชรัตน์',
    'ด.ญ. วรรณิดา ภักดี',
    'ด.ช. ศุภณัฐ ธนบดี',
    'ด.ญ. อริสา แก้วมณี',
    'ด.ช. ชลภัทร รุ่งเรือง',
    'ด.ญ. ธัญญา สุวรรณโชติ',
    'ด.ช. ภูริณัฐ เลิศวิชัย',
    'ด.ญ. มัทนา อุดมสุข',
    'ด.ช. วรเมธ พัฒนกุล'
];

// สีสันสดใส คมชัด มองเห็นง่ายจากระยะไกล
const SLICE_COLORS = [
    '#0284c7', // Sky Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber Gold
    '#ec4899', // Pink Rose
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#6366f1', // Indigo
    '#e11d48', // Crimson
    '#84cc16', // Lime
    '#3b82f6'  // Blue
];

// ==========================================
// 2. APP STATE
// ==========================================
class WheelApp {
    constructor() {
        this.classes = {};
        this.currentClassId = DEFAULT_CLASS_ID;
        this.activeNames = [];
        this.pickedNames = [];

        // Wheel Geometry & Animation State
        this.canvas = document.getElementById('wheel-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentAngle = 0; // ในหน่วยเรเดียน
        this.isSpinning = false;
        this.spinVelocity = 0;
        this.spinDuration = 6000; // มิลลิวินาที
        this.spinStartTime = null;
        this.startAngle = 0;
        this.targetAngle = 0;
        this.lastSliceIndex = -1;

        // Settings
        this.settings = {
            duration: 6, // วินาที
            sound: true,
            volume: 70,
            confetti: true,
            autoRemove: false
        };

        this.currentWinner = null;
        this.init();
    }

    init() {
        this.loadStorage();
        this.initDOM();
        this.bindEvents();
        this.setupCanvas();
        this.renderWheel();
        this.updateUI();
    }

    // ==========================================
    // 3. STORAGE MANAGEMENT
    // ==========================================
    loadStorage() {
        try {
            const savedClasses = localStorage.getItem('cw_classes');
            const savedClassId = localStorage.getItem('cw_current_class_id');
            const savedSettings = localStorage.getItem('cw_settings');

            if (savedClasses) {
                this.classes = JSON.parse(savedClasses);
            } else {
                this.classes = {
                    [DEFAULT_CLASS_ID]: {
                        id: DEFAULT_CLASS_ID,
                        name: 'ม.1/1 (ห้องตัวอย่าง)',
                        activeNames: [...DEFAULT_NAMES],
                        pickedNames: []
                    }
                };
            }

            if (savedClassId && this.classes[savedClassId]) {
                this.currentClassId = savedClassId;
            } else {
                this.currentClassId = Object.keys(this.classes)[0] || DEFAULT_CLASS_ID;
            }

            if (savedSettings) {
                this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
            }

            const current = this.classes[this.currentClassId];
            if (current) {
                this.activeNames = current.activeNames || [];
                this.pickedNames = current.pickedNames || [];
            }
        } catch (e) {
            console.error('Failed to load storage:', e);
            this.classes = {
                [DEFAULT_CLASS_ID]: {
                    id: DEFAULT_CLASS_ID,
                    name: 'ม.1/1 (ห้องตัวอย่าง)',
                    activeNames: [...DEFAULT_NAMES],
                    pickedNames: []
                }
            };
            this.activeNames = [...DEFAULT_NAMES];
            this.pickedNames = [];
        }

        // อัปเดตการตั้งค่าเสียง
        window.soundCtrl.setSoundEnabled(this.settings.sound);
        window.soundCtrl.setVolume(this.settings.volume / 100);
    }

    saveStorage() {
        if (!this.classes[this.currentClassId]) {
            this.classes[this.currentClassId] = {
                id: this.currentClassId,
                name: 'ห้องเรียน',
                activeNames: [],
                pickedNames: []
            };
        }

        this.classes[this.currentClassId].activeNames = this.activeNames;
        this.classes[this.currentClassId].pickedNames = this.pickedNames;

        localStorage.setItem('cw_classes', JSON.stringify(this.classes));
        localStorage.setItem('cw_current_class_id', this.currentClassId);
        localStorage.setItem('cw_settings', JSON.stringify(this.settings));
    }

    // ==========================================
    // 4. CANVAS SETUP & RENDERING
    // ==========================================
    setupCanvas() {
        const resize = () => {
            const wrapper = document.querySelector('.wheel-wrapper');
            const size = Math.min(wrapper.clientWidth, wrapper.clientHeight);
            const dpr = window.devicePixelRatio || 1;

            this.canvas.width = size * dpr;
            this.canvas.height = size * dpr;
            this.canvas.style.width = `${size}px`;
            this.canvas.style.height = `${size}px`;

            this.ctx.scale(dpr, dpr);
            this.renderWheel();
        };

        window.addEventListener('resize', resize);
        resize();
    }

    renderWheel() {
        const dpr = window.devicePixelRatio || 1;
        const size = this.canvas.width / dpr;
        const center = size / 2;
        const radius = center - 8;

        this.ctx.clearRect(0, 0, size, size);

        if (this.activeNames.length === 0) {
            // กรณีไม่มีรายชื่อ แสดงวงกลมว่างเปล่าพร้อมคำแนะนำ
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(center, center, radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#e2e8f0';
            this.ctx.fill();
            this.ctx.lineWidth = 6;
            this.ctx.strokeStyle = '#94a3b8';
            this.ctx.stroke();

            this.ctx.fillStyle = '#64748b';
            this.ctx.font = 'bold 22px Kanit';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('กรุณาเพิ่มรายชื่อนักเรียน', center, center);
            this.ctx.restore();
            return;
        }

        const totalSlices = this.activeNames.length;
        const arc = (2 * Math.PI) / totalSlices;

        // วาดแต่ละช่อง (Slices)
        for (let i = 0; i < totalSlices; i++) {
            const angle = this.currentAngle + i * arc;
            const color = SLICE_COLORS[i % SLICE_COLORS.length];

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(center, center);
            this.ctx.arc(center, center, radius, angle, angle + arc);
            this.ctx.closePath();

            this.ctx.fillStyle = color;
            this.ctx.fill();

            // เส้นขอบสีขาวระหว่างช่อง
            this.ctx.lineWidth = 2.5;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.stroke();

            // วาดตัวหนังสือ (Text)
            this.ctx.save();
            this.ctx.translate(center, center);
            this.ctx.rotate(angle + arc / 2);

            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = '#ffffff';

            // คำนวณขนาดตัวอักษรให้พอดี
            let fontSize = 20;
            if (totalSlices > 40) fontSize = 11;
            else if (totalSlices > 25) fontSize = 14;
            else if (totalSlices > 15) fontSize = 16;
            else if (totalSlices > 8) fontSize = 18;
            else fontSize = 22;

            this.ctx.font = `600 ${fontSize}px Kanit`;
            this.ctx.shadowColor = 'rgba(0,0,0,0.45)';
            this.ctx.shadowBlur = 4;

            const name = this.activeNames[i];
            const maxTextWidth = radius - 70;
            let displayName = name;

            // ตัดทอนชื่อหากยาวเกินไป
            if (this.ctx.measureText(displayName).width > maxTextWidth) {
                while (this.ctx.measureText(displayName + '...').width > maxTextWidth && displayName.length > 0) {
                    displayName = displayName.slice(0, -1);
                }
                displayName += '...';
            }

            this.ctx.fillText(displayName, radius - 20, 0);
            this.ctx.restore();

            this.ctx.restore();
        }

        // วาดขอบนอกของวงล้อ (Outer Golden/Metallic Rim)
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(center, center, radius, 0, 2 * Math.PI);
        this.ctx.lineWidth = 8;
        this.ctx.strokeStyle = '#0284c7';
        this.ctx.stroke();

        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.stroke();
        this.ctx.restore();
    }

    // ==========================================
    // 5. SPINNING LOGIC & PHYSICS
    // ==========================================
    spin() {
        if (this.isSpinning || this.activeNames.length === 0) return;

        window.soundCtrl.init();
        this.isSpinning = true;

        const spinBtn = document.getElementById('btn-spin');
        spinBtn.classList.add('spinning');

        // สุ่มรอบหมุน 5 ถึง 10 รอบ + สุ่มองศาปลายทาง
        const minRounds = 5;
        const extraRounds = Math.random() * 4 + 2;
        const totalRotation = (minRounds + extraRounds) * 2 * Math.PI + Math.random() * 2 * Math.PI;

        this.startAngle = this.currentAngle % (2 * Math.PI);
        this.targetAngle = this.startAngle + totalRotation;
        this.spinDuration = this.settings.duration * 1000;
        this.spinStartTime = performance.now();
        this.lastSliceIndex = -1;

        this.animateSpin();
    }

    animateSpin(now = performance.now()) {
        const elapsed = now - this.spinStartTime;
        const progress = Math.min(elapsed / this.spinDuration, 1);

        // Ease Out Cubic function (สมูทมาก เริ่มเร็ว ชะลอเนียนจนหยุด)
        const easeOut = 1 - Math.pow(1 - progress, 3.2);

        this.currentAngle = this.startAngle + (this.targetAngle - this.startAngle) * easeOut;

        // คำนวณเสียงเข็มติ๊กตามช่องที่ผ่าน
        this.checkPointerTick();

        this.renderWheel();

        if (progress < 1) {
            requestAnimationFrame((timestamp) => this.animateSpin(timestamp));
        } else {
            this.finishSpin();
        }
    }

    checkPointerTick() {
        if (this.activeNames.length === 0) return;

        const totalSlices = this.activeNames.length;
        const arc = (2 * Math.PI) / totalSlices;

        // ตัวชี้ (Pointer) อยู่ที่ขวา (มุม 0 เรเดียน หรือ 3 นาฬิกา)
        let normalizedAngle = (2 * Math.PI - (this.currentAngle % (2 * Math.PI))) % (2 * Math.PI);
        const currentSliceIndex = Math.floor(normalizedAngle / arc) % totalSlices;

        if (currentSliceIndex !== this.lastSliceIndex) {
            this.lastSliceIndex = currentSliceIndex;
            window.soundCtrl.playTick();

            // Pointer wobble animation
            const pointer = document.getElementById('wheel-pointer');
            pointer.classList.add('tick');
            setTimeout(() => pointer.classList.remove('tick'), 60);
        }
    }

    finishSpin() {
        this.isSpinning = false;
        const spinBtn = document.getElementById('btn-spin');
        spinBtn.classList.remove('spinning');

        // คำนวณผู้ชนะที่ตรงกับตัวชี้
        const totalSlices = this.activeNames.length;
        const arc = (2 * Math.PI) / totalSlices;
        let normalizedAngle = (2 * Math.PI - (this.currentAngle % (2 * Math.PI))) % (2 * Math.PI);
        const winnerIndex = Math.floor(normalizedAngle / arc) % totalSlices;

        this.currentWinner = this.activeNames[winnerIndex];

        // แสดงผลผู้ชนะ
        this.showWinnerModal(this.currentWinner);
    }

    // ==========================================
    // 6. WINNER MODAL & ACTIONS
    // ==========================================
    showWinnerModal(winnerName) {
        window.soundCtrl.playFanfare();

        if (this.settings.confetti) {
            window.confettiCtrl.fire(4500);
        }

        const modal = document.getElementById('modal-winner');
        const nameDisplay = document.getElementById('winner-name-display');
        nameDisplay.textContent = winnerName;
        modal.classList.remove('hidden');

        if (this.settings.autoRemove) {
            this.removeWinnerName(winnerName);
        }
    }

    removeWinnerName(name) {
        const index = this.activeNames.indexOf(name);
        if (index > -1) {
            this.activeNames.splice(index, 1);
            this.pickedNames.unshift(name);
            this.saveStorage();
            this.updateUI();
            this.renderWheel();
        }
    }

    restorePickedName(name) {
        const index = this.pickedNames.indexOf(name);
        if (index > -1) {
            this.pickedNames.splice(index, 1);
            this.activeNames.push(name);
            this.saveStorage();
            this.updateUI();
            this.renderWheel();
        }
    }

    restoreAllPicked() {
        if (this.pickedNames.length === 0) return;
        this.activeNames = [...this.activeNames, ...this.pickedNames];
        this.pickedNames = [];
        this.saveStorage();
        this.updateUI();
        this.renderWheel();
    }

    // ==========================================
    // 7. UI SYNC & EVENTS
    // ==========================================
    initDOM() {
        this.renderClassDropdown();
        this.renderClassesList();
        this.renderPickedList();

        const textarea = document.getElementById('names-input');
        textarea.value = this.activeNames.join('\n');

        // Setting values
        document.getElementById('setting-duration').value = this.settings.duration;
        document.getElementById('val-duration').textContent = `${this.settings.duration} วินาที`;
        document.getElementById('setting-sound-toggle').checked = this.settings.sound;
        document.getElementById('setting-volume').value = this.settings.volume;
        document.getElementById('val-volume').textContent = `${this.settings.volume}%`;
        document.getElementById('setting-confetti-toggle').checked = this.settings.confetti;
        document.getElementById('setting-autoremove-toggle').checked = this.settings.autoRemove;
    }

    updateUI() {
        // Badges
        document.getElementById('badge-active-count').textContent = this.activeNames.length;
        document.getElementById('badge-picked-count').textContent = this.pickedNames.length;

        // Textarea
        const textarea = document.getElementById('names-input');
        if (document.activeElement !== textarea) {
            textarea.value = this.activeNames.join('\n');
        }

        this.renderPickedList();
        this.renderClassesList();
    }

    renderClassDropdown() {
        const select = document.getElementById('class-select');
        select.innerHTML = '';

        Object.values(this.classes).forEach(cls => {
            const opt = document.createElement('option');
            opt.value = cls.id;
            opt.textContent = cls.name;
            if (cls.id === this.currentClassId) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });
    }

    renderPickedList() {
        const container = document.getElementById('picked-list-container');
        container.innerHTML = '';

        if (this.pickedNames.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>ยังไม่มีนักเรียนที่ถูกสุ่มเลือก</p></div>';
            return;
        }

        this.pickedNames.forEach(name => {
            const item = document.createElement('div');
            item.className = 'picked-item';
            item.innerHTML = `
                <span class="picked-item-name">${name}</span>
                <button class="btn-restore-single" data-name="${name}">คืนชื่อ</button>
            `;
            container.appendChild(item);
        });

        // Single restore click listeners
        container.querySelectorAll('.btn-restore-single').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.target.dataset.name;
                this.restorePickedName(name);
            });
        });
    }

    renderClassesList() {
        const container = document.getElementById('classes-list-container');
        container.innerHTML = '';

        Object.values(this.classes).forEach(cls => {
            const isActive = cls.id === this.currentClassId;
            const count = (cls.activeNames ? cls.activeNames.length : 0);

            const card = document.createElement('div');
            card.className = `class-card-item ${isActive ? 'active-class' : ''}`;
            card.innerHTML = `
                <div class="class-card-info">
                    <span class="class-card-title">${cls.name} ${isActive ? '(กำลังใช้งาน)' : ''}</span>
                    <span class="class-card-count">นักเรียน: ${count} คน</span>
                </div>
                <div class="class-card-actions">
                    ${!isActive ? `<button class="btn-sm-action use" data-id="${cls.id}">เลือกใช้</button>` : ''}
                    ${Object.keys(this.classes).length > 1 ? `<button class="btn-sm-action del" data-id="${cls.id}">ลบ</button>` : ''}
                </div>
            `;
            container.appendChild(card);
        });

        container.querySelectorAll('.btn-sm-action.use').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchClass(e.target.dataset.id);
            });
        });

        container.querySelectorAll('.btn-sm-action.del').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.deleteClass(e.target.dataset.id);
            });
        });
    }

    switchClass(classId) {
        if (!this.classes[classId]) return;
        this.currentClassId = classId;
        const current = this.classes[classId];
        this.activeNames = current.activeNames || [];
        this.pickedNames = current.pickedNames || [];
        this.saveStorage();
        this.renderClassDropdown();
        this.updateUI();
        this.renderWheel();
    }

    addNewClass(className) {
        const id = 'class_' + Date.now();
        this.classes[id] = {
            id: id,
            name: className || `ห้องใหม่ ${Object.keys(this.classes).length + 1}`,
            activeNames: [...DEFAULT_NAMES],
            pickedNames: []
        };
        this.switchClass(id);
    }

    deleteClass(classId) {
        if (Object.keys(this.classes).length <= 1) {
            alert('ต้องมีห้องเรียนอย่างน้อย 1 ห้อง');
            return;
        }
        if (confirm(`คุณต้องการลบห้อง "${this.classes[classId].name}" ใช่หรือไม่?`)) {
            delete this.classes[classId];
            if (this.currentClassId === classId) {
                this.currentClassId = Object.keys(this.classes)[0];
            }
            this.switchClass(this.currentClassId);
        }
    }

    // ==========================================
    // 8. BIND EVENT LISTENERS
    // ==========================================
    bindEvents() {
        // Spin Button & Canvas Click
        document.getElementById('btn-spin').addEventListener('click', () => this.spin());
        this.canvas.addEventListener('click', () => this.spin());

        // Keyboard Shortcut: Space to Spin, F for Fullscreen, M for Sound
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
                e.preventDefault();
                this.spin();
            } else if (e.code === 'KeyF' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
                this.toggleFullscreen();
            } else if (e.code === 'KeyM' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
                this.toggleSound();
            }
        });

        // Textarea live input
        const textarea = document.getElementById('names-input');
        textarea.addEventListener('input', (e) => {
            const lines = e.target.value.split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0);
            this.activeNames = lines;
            this.saveStorage();
            document.getElementById('badge-active-count').textContent = this.activeNames.length;
            this.renderWheel();
        });

        // Tabs Switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            });
        });

        // Class dropdown select
        document.getElementById('class-select').addEventListener('change', (e) => {
            this.switchClass(e.target.value);
        });

        // Toolbar Buttons
        document.getElementById('btn-shuffle').addEventListener('click', () => {
            // Fisher-Yates Shuffle
            for (let i = this.activeNames.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.activeNames[i], this.activeNames[j]] = [this.activeNames[j], this.activeNames[i]];
            }
            this.saveStorage();
            this.updateUI();
            this.renderWheel();
            window.soundCtrl.playClick();
        });

        document.getElementById('btn-sort').addEventListener('click', () => {
            this.activeNames.sort((a, b) => a.localeCompare(b, 'th'));
            this.saveStorage();
            this.updateUI();
            this.renderWheel();
            window.soundCtrl.playClick();
        });

        document.getElementById('btn-clear-names').addEventListener('click', () => {
            if (confirm('คุณต้องการล้างรายชื่อทั้งหมดในวงล้อใช่หรือไม่?')) {
                this.activeNames = [];
                this.saveStorage();
                this.updateUI();
                this.renderWheel();
            }
        });

        document.getElementById('btn-restore-all').addEventListener('click', () => {
            this.restoreAllPicked();
        });

        // Import / Export Files
        const fileInput = document.getElementById('file-input');
        document.getElementById('btn-import-file').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const text = ev.target.result;
                const imported = text.split(/\r?\n/)
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                if (imported.length > 0) {
                    this.activeNames = imported;
                    this.saveStorage();
                    this.updateUI();
                    this.renderWheel();
                }
            };
            reader.readAsText(file);
            fileInput.value = '';
        });

        document.getElementById('btn-export-file').addEventListener('click', () => {
            const content = this.activeNames.join('\n');
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `รายชื่อ_${this.classes[this.currentClassId].name}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        });

        // Header Sound Toggle Button
        document.getElementById('btn-toggle-sound').addEventListener('click', () => this.toggleSound());

        // Header Fullscreen Button
        document.getElementById('btn-fullscreen').addEventListener('click', () => this.toggleFullscreen());

        // Winner Modal Actions
        const winnerModal = document.getElementById('modal-winner');
        document.getElementById('btn-close-winner').addEventListener('click', () => {
            winnerModal.classList.add('hidden');
        });

        document.getElementById('btn-remove-winner').addEventListener('click', () => {
            if (this.currentWinner) {
                this.removeWinnerName(this.currentWinner);
            }
            winnerModal.classList.add('hidden');
        });

        document.getElementById('btn-keep-winner').addEventListener('click', () => {
            winnerModal.classList.add('hidden');
        });

        document.getElementById('btn-spin-again').addEventListener('click', () => {
            winnerModal.classList.add('hidden');
            setTimeout(() => this.spin(), 200);
        });

        // Add Class Modals
        const addClassModal = document.getElementById('modal-add-class');
        const openAddClass = () => {
            document.getElementById('input-new-class-name').value = '';
            addClassModal.classList.remove('hidden');
            document.getElementById('input-new-class-name').focus();
        };

        document.getElementById('btn-add-class').addEventListener('click', openAddClass);
        document.getElementById('btn-new-class-tab').addEventListener('click', openAddClass);

        document.getElementById('btn-close-add-class').addEventListener('click', () => {
            addClassModal.classList.add('hidden');
        });
        document.getElementById('btn-cancel-add-class').addEventListener('click', () => {
            addClassModal.classList.add('hidden');
        });

        document.getElementById('btn-confirm-add-class').addEventListener('click', () => {
            const name = document.getElementById('input-new-class-name').value.trim();
            if (name) {
                this.addNewClass(name);
                addClassModal.classList.add('hidden');
            }
        });

        // Settings Modal
        const settingsModal = document.getElementById('modal-settings');
        document.getElementById('btn-open-settings').addEventListener('click', () => {
            settingsModal.classList.remove('hidden');
        });
        document.getElementById('btn-close-settings').addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });

        document.getElementById('setting-duration').addEventListener('input', (e) => {
            document.getElementById('val-duration').textContent = `${e.target.value} วินาที`;
        });
        document.getElementById('setting-volume').addEventListener('input', (e) => {
            document.getElementById('val-volume').textContent = `${e.target.value}%`;
            window.soundCtrl.setVolume(e.target.value / 100);
        });

        document.getElementById('btn-save-settings').addEventListener('click', () => {
            this.settings.duration = parseInt(document.getElementById('setting-duration').value, 10);
            this.settings.sound = document.getElementById('setting-sound-toggle').checked;
            this.settings.volume = parseInt(document.getElementById('setting-volume').value, 10);
            this.settings.confetti = document.getElementById('setting-confetti-toggle').checked;
            this.settings.autoRemove = document.getElementById('setting-autoremove-toggle').checked;

            window.soundCtrl.setSoundEnabled(this.settings.sound);
            window.soundCtrl.setVolume(this.settings.volume / 100);

            this.saveStorage();
            this.updateSoundIcons();
            settingsModal.classList.add('hidden');
        });
    }

    toggleSound() {
        this.settings.sound = !this.settings.sound;
        window.soundCtrl.setSoundEnabled(this.settings.sound);
        document.getElementById('setting-sound-toggle').checked = this.settings.sound;
        this.saveStorage();
        this.updateSoundIcons();
    }

    updateSoundIcons() {
        const iconOn = document.getElementById('sound-icon-on');
        const iconOff = document.getElementById('sound-icon-off');
        if (this.settings.sound) {
            iconOn.classList.remove('hidden');
            iconOff.classList.add('hidden');
        } else {
            iconOn.classList.add('hidden');
            iconOff.classList.remove('hidden');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Fullscreen request failed:', err);
            });
            document.getElementById('icon-fs-enter').classList.add('hidden');
            document.getElementById('icon-fs-exit').classList.remove('hidden');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            document.getElementById('icon-fs-enter').classList.remove('hidden');
            document.getElementById('icon-fs-exit').classList.add('hidden');
        }
    }
}

// Start app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WheelApp();
});
