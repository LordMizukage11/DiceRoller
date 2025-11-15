/**
 * Represents a single die.
 */
class Die {
    constructor(sides) {
        this.sides = sides;
    }

    roll() {
        return Math.floor(Math.random() * this.sides) + 1;
    }
}

/**
 * Represents a collection of Die objects.
 */
class DicePool {
    constructor(diceNumber, sides) {
        this.dice = [];
        this.results = [];
        for (let i = 0; i < diceNumber; i++) {
            this.dice.push(new Die(sides));
        }
    }

    roll() {
        this.results = this.dice.map(die => die.roll());
        return this.results;
    }

    getSum() {
        return this.results.reduce((sum, val) => sum + val, 0);
    }

    getSuccesses(successThreshold, doubleNums = []) {
        return this.results.reduce((successes, result) => {
            if (result >= successThreshold) {
                return successes + (doubleNums.includes(result) ? 2 : 1);
            }
            return successes;
        }, 0);
    }

    getSets() {
        const counts = {};
        this.results.forEach(num => {
            counts[num] = (counts[num] || 0) + 1;
        });

        return Object.entries(counts)
            .filter(([_, count]) => count >= 2)
            .map(([num, count]) => ({ num: parseInt(num), count: count }))
            .sort((a, b) => b.count - a.count || b.num - a.num);
    }
}

/**
 * Main Controller Class
 */
class DiceRoller {
    constructor() {
        // Config: Map IDs to class properties
        this.ui = {
            tabsContainer: '.tabs',
            rollerContainer: 'roller',
            historyContainer: 'history',
            clearButton: 'clearHistoryBtn'
        };

        this.history = [];

        // Initialize
        this.loadHistory();
        this.bindEvents();
        
        // Start with D&D active
        const firstTab = document.querySelector(`${this.ui.tabsContainer} .tab-button`);
        if (firstTab) this.switchSystem('dnd', firstTab);
        
        this.updateHistoryUI();
    }

    bindEvents() {
        // Tab Switching
        document.querySelector(this.ui.tabsContainer).addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                const system = e.target.dataset.system;
                this.switchSystem(system, e.target);
            }
        });

        // Roll Button Clicks (Delegation)
        document.getElementById(this.ui.rollerContainer).addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' && e.target.dataset.roll) {
                this.roll(e.target.dataset.roll);
            }
        });

        // Clear History
        const clearBtn = document.getElementById(this.ui.clearButton);
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearHistory());
        }
    }

    switchSystem(system, button) {
        // Update Tab UI
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        if (button) button.classList.add('active');

        // Inject HTML based on system
        const container = document.getElementById(this.ui.rollerContainer);
        switch (system) {
            case 'dnd': container.innerHTML = this.getDndHtml(); break;
            case 'exalted': container.innerHTML = this.getExaltedHtml(); break;
            case 'oneRing': container.innerHTML = this.getOneRingHtml(); break;
            case 'ore': container.innerHTML = this.getOreHtml(); break;
            case 'runescape': container.innerHTML = this.getRunescapeHtml(); break;
        }
    }

    // --- HTML Generators ---

    getDndHtml() {
        return `
            <div class="input-group">
                <label for="dndNum">Number of Dice</label>
                <input type="number" id="dndNum" value="1" min="1" />
            </div>
            <div class="input-group">
                <label for="dndDiceType">Sides per Die</label>
                <input type="number" id="dndDiceType" value="20" min="2" />
            </div>
            <button data-roll="dnd">Roll Dice</button>
        `;
    }

    getExaltedHtml() {
        return `
            <div class="input-group">
                <label for="exaltedInput">Dice Pool</label>
                <input type="number" id="exaltedInput" value="10" min="1" />
            </div>
            <div class="checkbox-group">
                <span>Double on:</span>
                <label><input type="checkbox" id="double10" checked /> 10s</label>
                <label><input type="checkbox" id="double9" /> 9s</label>
            </div>
            <button data-roll="exalted">Roll Exalted</button>
        `;
    }

    getOneRingHtml() {
        return `
            <div class="input-group">
                <label for="ringDice">Dice Pool (d6)</label>
                <input type="number" id="ringDice" value="6" min="1" />
            </div>
            <div class="input-group">
                <label for="ringTN">Target Number</label>
                <input type="number" id="ringTN" value="18" />
            </div>
            <button data-roll="oneRing">Roll One Ring</button>
        `;
    }

    getOreHtml() {
        return `
            <div class="input-group">
                <label for="oreInput">Dice Pool (d10)</label>
                <input type="number" id="oreInput" value="10" min="1" />
            </div>
            <button data-roll="ore">Roll O.R.E.</button>
        `;
    }

    getRunescapeHtml() {
        return `
            <div class="input-group">
                <label for="rsTN">Target Number (Roll 3d6 <= TN)</label>
                <input type="number" id="rsTN" value="12" />
            </div>
            <div class="checkbox-group">
                <label><input type="checkbox" id="rsAdv" /> Advantage</label>
                <label><input type="checkbox" id="rsDis" /> Disadvantage</label>
            </div>
            <button data-roll="runescape">Roll RuneScape</button>
        `;
    }

    // --- Logic ---

    _getInt(id) { return parseInt(document.getElementById(id).value) || 0; }
    _isChecked(id) { const el = document.getElementById(id); return el ? el.checked : false; }

    roll(system) {
        let result = '';
        try {
            if (system === 'dnd') {
                const num = this._getInt('dndNum');
                const sides = this._getInt('dndDiceType');
                const pool = new DicePool(num, sides);
                result = `D&D (${num}d${sides}): [${pool.roll().join(', ')}] = <strong>${pool.getSum()}</strong>`;
            } 
            else if (system === 'exalted') {
                const count = this._getInt('exaltedInput');
                const doubles = [];
                if (this._isChecked('double10')) doubles.push(10);
                if (this._isChecked('double9')) doubles.push(9);
                const pool = new DicePool(count, 10);
                result = `Exalted (${count}d10): [${pool.roll().join(', ')}] → <strong>${pool.getSuccesses(7, doubles)} Successes</strong>`;
            }
            else if (system === 'oneRing') {
                const count = this._getInt('ringDice');
                const tn = this._getInt('ringTN');
                const pool = new DicePool(count, 6);
                const total = pool.roll().reduce((a,b)=>a+b, 0);
                const outcome = total >= tn ? "Success" : "Failure";
                result = `One Ring (${count}d6): <strong>${total}</strong> vs TN ${tn} → <strong>${outcome}</strong>`;
            }
            else if (system === 'ore') {
                const count = this._getInt('oreInput');
                const pool = new DicePool(count, 10);
                const rolls = pool.roll();
                // ✨ **MODIFIED LINE** ✨
                // Wrap each set in a span for styling
                const sets = pool.getSets().map(s => `<span class="roll-set">${s.count}x${s.num}</span>`).join(', ');
                result = `ORE (${count}d10): [${rolls.join(', ')}] → ${sets || "No Sets"}`;
            }
            else if (system === 'runescape') {
                const tn = this._getInt('rsTN');
                const adv = this._isChecked('rsAdv');
                const dis = this._isChecked('rsDis');
                
                let numDice = (adv !== dis) ? 4 : 3; // 4 dice if exactly one check is active
                const pool = new DicePool(numDice, 6);
                let rolls = pool.roll().sort((a,b) => a - b);
                
                let keptRolls = rolls;
                let type = "Normal";

                if (adv && !dis) {
                    keptRolls = rolls.slice(0, 3); // Keep lowest
                    type = "Advantage";
                } else if (dis && !adv) {
                    keptRolls = rolls.slice(1); // Keep highest
                    type = "Disadvantage";
                }

                const total = keptRolls.reduce((a,b) => a+b, 0);
                const success = total <= tn ? "Success" : "Failure";
                result = `RS (${type}): [${rolls.join(',')}] Keep [${keptRolls.join(',')}] = <strong>${total}</strong> vs TN ${tn} → <strong>${success}</strong>`;
            }
        } catch (e) {
            result = "Error: Invalid Input";
        }

        this.history.unshift(result);
        this.saveHistory();
        this.updateHistoryUI();
    }

    // --- History ---

    saveHistory() {
        localStorage.setItem('rollHistory', JSON.stringify(this.history.slice(0, 20)));
    }

    loadHistory() {
        const stored = localStorage.getItem('rollHistory');
        if (stored) this.history = JSON.parse(stored);
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.updateHistoryUI();
    }

    updateHistoryUI() {
        const container = document.getElementById(this.ui.historyContainer);
        if (this.history.length === 0) {
            container.innerHTML = '<h3>Recent Rolls</h3><p>No rolls yet.</p>';
        } else {
            container.innerHTML = `<h3>Recent Rolls</h3><ul>${this.history.map(r => `<li>${r}</li>`).join('')}</ul>`;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => new DiceRoller());