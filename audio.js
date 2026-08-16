/**
 * Audio Effects using Web Audio API
 * ไม่ต้องโหลดไฟล์เสียงภายนอก โหลดเร็ว เสียงคมชัด และไม่มีปัญหาลิงก์เสีย
 */
class SoundController {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.volume = 0.7;
        this.lastTickTime = 0;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
    }

    // เสียงติ๊กเมื่อเข็มกระทบขอบช่อง (Tick Sound)
    playTick() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // ป้องกันเสียงซ้อนกันถี่เกินไป
        if (now - this.lastTickTime < 0.035) return;
        this.lastTickTime = now;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // สร้างโทนเสียงเคาะไม้/พลาสติกคมชัด
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(160, now + 0.04);

            gain.gain.setValueAtTime(this.volume * 0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.04);
        } catch (e) {
            console.warn('Audio tick error:', e);
        }
    }

    // เสียงชัยชนะ/แสดงความยินดี (Victory Fanfare)
    playFanfare() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            
            // คอร์ดแห่งความสุข (Major Chords arpeggio: C5 -> E5 -> G5 -> C6 -> E6)
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            
            notes.forEach((freq, idx) => {
                const startTime = now + idx * 0.09;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.001, startTime);
                gain.gain.linearRampToValueAtTime(this.volume * 0.45, startTime + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.55);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.6);
            });

            // คอร์ดประคองเสียงกังวานตอนจบ (Big chord)
            const finalChordTime = now + 0.5;
            const chordNotes = [523.25, 659.25, 783.99, 1046.50];
            chordNotes.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, finalChordTime);

                gain.gain.setValueAtTime(0.001, finalChordTime);
                gain.gain.linearRampToValueAtTime(this.volume * 0.35, finalChordTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, finalChordTime + 1.2);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(finalChordTime);
                osc.stop(finalChordTime + 1.3);
            });

        } catch (e) {
            console.warn('Audio fanfare error:', e);
        }
    }

    // เสียงกดปุ่ม (Click Sound)
    playClick() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

            gain.gain.setValueAtTime(this.volume * 0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {
            console.warn('Audio click error:', e);
        }
    }
}

window.soundCtrl = new SoundController();
