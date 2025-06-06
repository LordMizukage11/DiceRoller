class Die {
    constructor(sides) {
        this.sides = sides;
    }
    roll() {
        return Math.floor(Math.random() * this.sides) + 1;
    }
}

class DicePool {
    constructor(diceNumber, sides) {
        this.dice = [];
        for (let i = 0; i < diceNumber; i++) {
            this.dice.push(new Die(sides));
        }
    }

    rollAllResults() {
        return this.dice.map(die => die.roll());
    }

    rollSum() {
        return this.rollAllResults().reduce((sum, val) => sum + val, 0);
    }

    rollSuccesses(successThreshold, doubleNums = []) {
        return this.rollAllResults().reduce((successes, result) => {
            if (result >= successThreshold) {
                return successes + (doubleNums.includes(result) ? 2 : 1);
            }
            return successes;
        }, 0);
    }
}

function rollDND(diceNum, diceType) {
    const num = parseInt(diceNum);
    const sides = parseInt(diceType);
    if (isNaN(num) || isNaN(sides)) {
        return `Invalid input. Please enter numbers for both dice count and sides.`;
    }

    const pool = new DicePool(num, sides);
    const rolls = pool.rollAllResults();
    const total = rolls.reduce((a, b) => a + b, 0);
    return `${num}d${sides}: [${rolls.join(', ')}] = ${total}`;
}


function rollExalted(diceCount, doubleNums = [10]) {
    const pool = new DicePool(diceCount, 10);
    const successes = pool.rollSuccesses(7, doubleNums);
    return `Exalted (${diceCount}d10): ${successes} successes (Doubles on: ${doubleNums.join(', ')})`;
}



function rollOneRing(diceCount, targetNumber) {
    const pool = new DicePool(diceCount, 6);
    const total = pool.rollSum();
    const success = total >= targetNumber ? "Success" : "Failure";
    return `The One Ring (${diceCount}d6): ${total} vs TN ${targetNumber} → ${success}`;
}

function rollORE(diceCount) {
  const pool = new DicePool(diceCount, 10);
  const rolls = pool.rollAllResults();

  // Count occurrences
  const counts = {};
  rolls.forEach(num => {
    counts[num] = (counts[num] || 0) + 1;
  });

  // Find sets
  const sets = Object.entries(counts)
    .filter(([_, count]) => count >= 2)
    .map(([num, count]) => `${count}x${num}`)
    .sort((a, b) => b[0] - a[0]); // Optional: sort by width

  const resultText = sets.length > 0
    ? `ORE (${diceCount}d10): [${rolls.join(', ')}] → Sets: ${sets.join(', ')}`
    : `ORE (${diceCount}d10): [${rolls.join(', ')}] → No sets`;

  return resultText;
}

function switchSystem(system, button) {
  currentSystem = system;

  // Highlight active tab
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  if (button) button.classList.add('active');

  let html = '';
  if (system === 'dnd') {
    html = `
        <div class="input-group">
            <label for="dndNum">Number of Dice</label>
            <input type="number" id="dndNum" placeholder="e.g., 2" />
        </div>

        <div class="input-group">
            <label for="dndDiceType">Sides per Die</label>
            <input type="number" id="dndDiceType" placeholder="e.g., 20" />
        </div>
        <button onclick="rollDice('dnd')">Roll</button>
    `;
  } else if (system === 'exalted') {
    html = `
        <div class="input-group">
            <label for="exaltedInput">Dice Pool</label>
            <input type="number" id="exaltedInput" placeholder="e.g., 10" />
        </div>

        <div class="checkbox-group">
            <label><strong>Doubles On:</strong></label>
            <label><input type="checkbox" id="double10" checked /> 10s</label>
            <label><input type="checkbox" id="double9" /> 9s</label>
        </div>
        <button onclick="rollDice('exalted')">Roll</button>
    `;
  } else if (system === 'oneRing') {
    html = `
        <div class="input-group">
            <label for="ringDice">Dice Pool</label>
            <input type="number" id="ringDice" placeholder="Dice Pool (e.g., 6)" />
        </div>

        <div class="input-group">
            <label for="ringTN">Target Number</label>
            <input type="number" id="ringTN" placeholder="Target Number (e.g., 18)" />
        </div>
        <button onclick="rollDice('oneRing')">Roll</button>
    `;
  } else if (system === 'ore') {
    html = `
        <input type="number" id="oreInput" placeholder="Dice Pool (e.g., 10)" />
        <button onclick="rollDice('ore')">Roll</button>
        `;
    }


  document.getElementById('roller').innerHTML = html;
}

function rollDice(system) {
  let result = '';
  if (system === 'dnd') {
        const type = document.getElementById('dndDiceType').value ;
        const num = document.getElementById('dndNum').value ;
        result = rollDND(num, type);
    
    } else if (system === 'exalted') {
        const count = parseInt(document.getElementById('exaltedInput').value) || 10;
        const doubleNums = [];
        if (document.getElementById('double10').checked) doubleNums.push(10);
        if (document.getElementById('double9').checked) doubleNums.push(9);
        result = rollExalted(count, doubleNums);
    } else if (system === 'oneRing') {
        const count = parseInt(document.getElementById('ringDice').value) || 6;
        const tn = parseInt(document.getElementById('ringTN').value) || 18;
        result = rollOneRing(count, tn);
    } 
    else if (system === 'ore') {
        const count = parseInt(document.getElementById('oreInput').value) || 10;
        result = rollORE(count);
    }
    history.unshift(result);
    history = history.slice(0, 10);
    localStorage.setItem('rollHistory', JSON.stringify(history));
    updateHistory();
}


function clearHistory() {
    history = [];
    localStorage.removeItem('rollHistory');
    updateHistory();
}

function updateHistory() {
  document.getElementById('history').innerHTML = `<h3>Recent Rolls</h3><ul>${history.map(r => `<li>${r}</li>`).join('')}</ul>`;
}


let history = [];

try {
  const stored = JSON.parse(localStorage.getItem('rollHistory'));
  if (Array.isArray(stored)) {
    history = stored;
  }
} catch (e) {
  console.warn("Failed to parse roll history from localStorage:", e);
}


switchSystem('dnd', document.querySelector('.tab-button'));
updateHistory();

