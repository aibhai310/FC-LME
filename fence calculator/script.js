// PASSWORD CONFIGURATION - CHANGE THIS!
const CORRECT_PASSWORD = "fence2025"; // ⚠️ CHANGE THIS PASSWORD!

// Gate types data
const GATE_TYPES = [
    { type: "DLS", description: "Double Leaf Swing Gate", defaultRate: 500, defaultWeight: 150 },
    { type: "SLS", description: "Single Leaf Swing Gate", defaultRate: 300, defaultWeight: 80 },
    { type: "SLE", description: "Sliding Gate", defaultRate: 800, defaultWeight: 200 }
];

// Gate rows management
let gateRows = [];

// Password Functions
function checkPassword() {
    const input = document.getElementById('password-input').value;
    const error = document.getElementById('error-message');
    
    if (input === CORRECT_PASSWORD) {
        // Correct password - show calculator
        document.getElementById('password-protection').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
        
        // Store in session so password isn't needed again
        sessionStorage.setItem('authenticated', 'true');
    } else {
        // Wrong password - show error
        error.style.display = 'block';
        document.getElementById('password-input').value = '';
        document.getElementById('password-input').focus();
    }
}

// Gate Management Functions
function addGateRow(gateType = "DLS") {
    const tableBody = document.getElementById('gateTableBody');
    const rowId = Date.now() + Math.random();
    
    const gateTypeData = GATE_TYPES.find(g => g.type === gateType) || GATE_TYPES[0];
    
    const row = document.createElement('tr');
    row.id = `gateRow-${rowId}`;
    row.innerHTML = `
        <td>
            <select class="gate-type" onchange="updateGateRow('${rowId}', this.value)">
                ${GATE_TYPES.map(g => 
                    `<option value="${g.type}" ${g.type === gateType ? 'selected' : ''}>${g.type} (${g.description})</option>`
                ).join('')}
            </select>
        </td>
        <td><input type="number" class="gate-rate" value="${gateTypeData.defaultRate}" min="0" step="0.01" oninput="calculateGateRow('${rowId}')"></td>
        <td><input type="number" class="gate-quantity" value="0" min="0" step="1" oninput="calculateGateRow('${rowId}')"></td>
        <td><input type="number" class="gate-weight" value="${gateTypeData.defaultWeight}" min="0" step="0.01" oninput="calculateGateRow('${rowId}')"></td>
        <td class="hidden-column gate-total-cost" data-row="${rowId}">AED 0.00</td>
        <td class="hidden-column gate-total-weight" data-row="${rowId}">0.00 kg</td>
        <td><button type="button" class="remove-gate-row" onclick="removeGateRow('${rowId}')">Remove</button></td>
    `;
    
    tableBody.appendChild(row);
    gateRows.push(rowId);
    calculateGateRow(rowId);
    calculateCosts();
}

function updateGateRow(rowId, newType) {
    const gateTypeData = GATE_TYPES.find(g => g.type === newType);
    if (!gateTypeData) return;
    
    const row = document.getElementById(`gateRow-${rowId}`);
    row.querySelector('.gate-rate').value = gateTypeData.defaultRate;
    row.querySelector('.gate-weight').value = gateTypeData.defaultWeight;
    
    calculateGateRow(rowId);
    calculateCosts();
}

function calculateGateRow(rowId) {
    const row = document.getElementById(`gateRow-${rowId}`);
    if (!row) return;
    
    const rate = parseFloat(row.querySelector('.gate-rate').value) || 0;
    const quantity = parseInt(row.querySelector('.gate-quantity').value) || 0;
    const weight = parseFloat(row.querySelector('.gate-weight').value) || 0;
    
    const totalCost = rate * quantity;
    const totalWeight = weight * quantity;
    
    row.querySelector(`.gate-total-cost[data-row="${rowId}"]`).textContent = formatCurrency(totalCost);
    row.querySelector(`.gate-total-weight[data-row="${rowId}"]`).textContent = formatWeight(totalWeight);
    
    updateGateTotals();
}

function updateGateTotals() {
    let totalQuantity = 0;
    let totalCost = 0;
    let totalWeight = 0;
    
    gateRows.forEach(rowId => {
        const row = document.getElementById(`gateRow-${rowId}`);
        if (row) {
            const quantity = parseInt(row.querySelector('.gate-quantity').value) || 0;
            const rate = parseFloat(row.querySelector('.gate-rate').value) || 0;
            const weight = parseFloat(row.querySelector('.gate-weight').value) || 0;
            
            totalQuantity += quantity;
            totalCost += rate * quantity;
            totalWeight += weight * quantity;
        }
    });
    
    document.getElementById('totalGatesWeight').textContent = formatWeight(totalWeight);
    document.getElementById('totalGatesCost').textContent = formatCurrency(totalCost);
}

function removeGateRow(rowId) {
    const row = document.getElementById(`gateRow-${rowId}`);
    if (row) {
        row.remove();
        gateRows = gateRows.filter(id => id !== rowId);
        updateGateTotals();
        calculateCosts();
    }
}

// Utility Functions
function formatCurrency(amount) {
    return 'AED ' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function formatWeight(weight) {
    return weight.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' kg';
}

// Collapsible Functions
function toggleCollapsible(contentId, headerId) {
    const content = document.getElementById(contentId);
    const header = document.getElementById(headerId);
    const icon = header.querySelector('.collapsible-icon');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        icon.classList.remove('expanded');
    } else {
        content.classList.add('expanded');
        icon.classList.add('expanded');
    }
}

function updateGateBreakdownTable(gateDetails) {
    const tbody = document.getElementById('gateBreakdownBody');
    tbody.innerHTML = '';
    
    if (gateDetails.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" style="text-align: center; padding: 20px;">No gates added</td>`;
        tbody.appendChild(row);
        return;
    }
    
    gateDetails.forEach(gate => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${gate.type}</td>
            <td>${gate.quantity}</td>
            <td>${formatCurrency(gate.rate)}</td>
            <td>${formatWeight(gate.weight)}</td>
            <td>${formatCurrency(gate.totalCost)}</td>
            <td>${formatWeight(gate.totalWeight)}</td>
        `;
        tbody.appendChild(row);
    });
    
    // Add total row
    const totalRow = document.createElement('tr');
    totalRow.className = 'total-row';
    const totalCost = gateDetails.reduce((sum, gate) => sum + gate.totalCost, 0);
    const totalWeight = gateDetails.reduce((sum, gate) => sum + gate.totalWeight, 0);
    const totalQuantity = gateDetails.reduce((sum, gate) => sum + gate.quantity, 0);
    
    totalRow.innerHTML = `
        <td><strong>Total</strong></td>
        <td><strong>${totalQuantity}</strong></td>
        <td></td>
        <td></td>
        <td><strong>${formatCurrency(totalCost)}</strong></td>
        <td><strong>${formatWeight(totalWeight)}</strong></td>
    `;
    tbody.appendChild(totalRow);
}

function updateGateCostCards() {
    const includeInstallation = document.getElementById('installation').checked;
    const gateMaterialCard = document.getElementById('gateMaterialCostCard');
    const gateInstallationCard = document.getElementById('gateInstallationCostCard');
    const gateMaterialRow = document.getElementById('gateMaterialRow');
    const gateInstallationRow = document.getElementById('gateInstallationRow');
    
    if (includeInstallation) {
        gateMaterialCard.style.display = 'block';
        gateInstallationCard.style.display = 'block';
        gateMaterialRow.style.display = 'table-row';
        gateInstallationRow.style.display = 'table-row';
        
        // Update results grid to show 6 items (3x2 layout)
        document.querySelector('.results-grid').style.gridTemplateColumns = '1fr 1fr';
    } else {
        gateMaterialCard.style.display = 'none';
        gateInstallationCard.style.display = 'none';
        gateMaterialRow.style.display = 'none';
        gateInstallationRow.style.display = 'none';
        
        // Update results grid to show 4 items (2x2 layout)
        document.querySelector('.results-grid').style.gridTemplateColumns = '1fr 1fr';
    }
}

// Main Calculation Function
function calculateCosts() {
    // Get input values
    const distance = parseFloat(document.getElementById('distance').value) || 0;
    const rate = parseFloat(document.getElementById('rate').value) || 0;
    const postQty = parseInt(document.getElementById('postQty').value) || 0;
    const totalPostWeightInput = parseFloat(document.getElementById('totalPostWeightInput').value) || 0;
    const includeInstallation = document.getElementById('installation').checked;
    
    // Calculate gate totals
    let totalGatesValue = 0;
    let totalGateWeight = 0;
    let totalGateQuantity = 0;
    const gateDetails = [];
    
    gateRows.forEach(rowId => {
        const row = document.getElementById(`gateRow-${rowId}`);
        if (row) {
            const gateType = row.querySelector('.gate-type').value;
            const gateRate = parseFloat(row.querySelector('.gate-rate').value) || 0;
            const gateQuantity = parseInt(row.querySelector('.gate-quantity').value) || 0;
            const gateWeight = parseFloat(row.querySelector('.gate-weight').value) || 0;
            const gateTotalCost = gateRate * gateQuantity;
            const gateTotalWeight = gateWeight * gateQuantity;
            
            totalGatesValue += gateTotalCost;
            totalGateWeight += gateTotalWeight;
            totalGateQuantity += gateQuantity;
            
            if (gateQuantity > 0) {
                gateDetails.push({
                    type: gateType,
                    rate: gateRate,
                    quantity: gateQuantity,
                    weight: gateWeight,
                    totalCost: gateTotalCost,
                    totalWeight: gateTotalWeight
                });
            }
        }
    });
    
    // Update gate breakdown table
    updateGateBreakdownTable(gateDetails);
    
    // Calculate post values
    const totalPostWeight = totalPostWeightInput;
    const weightPerPost = postQty > 0 ? totalPostWeight / postQty : 0;
    
    // Update calculated values in UI
    document.getElementById('calculatedWeight').value = weightPerPost.toFixed(2);
    document.getElementById('displayWeightPerPost').textContent = formatWeight(weightPerPost);
    
    // Calculate costs
    const totalDistanceCost = distance * rate;
    
    // Material and installation allocation
    const materialPercentage = includeInstallation ? 0.7 : 1.0;
    const installationPercentage = includeInstallation ? 0.3 : 0.0;
    
    const materialAllocation = totalDistanceCost * materialPercentage;
    const installationAllocation = totalDistanceCost * installationPercentage;
    
    // Material breakdown
    const fenceCost = materialAllocation * 0.4; // 40% for fence (cost per KM)
    const postCost = materialAllocation * 0.6; // 60% for posts
    const individualPostCost = postQty > 0 ? postCost / postQty : 0;
    
    // Calculate cost per linear meter
    const costPerLM = distance > 0 ? fenceCost / distance : 0;
    
    // Gate material and installation costs
    const gateMaterialPercentage = includeInstallation ? 0.7 : 1.0;
    const gateInstallationPercentage = includeInstallation ? 0.3 : 0.0;
    
    const gateMaterialCost = totalGatesValue * gateMaterialPercentage;
    const gateInstallationCost = totalGatesValue * gateInstallationPercentage;
    
    // Grand total
    const grandTotal = totalDistanceCost + totalGatesValue + (includeInstallation ? gateInstallationCost : 0);
    
    // Weight calculations
    const distanceInMeters = distance * 1000;
    const totalWeight = totalPostWeight + totalGateWeight;
    const weightPerLM = distanceInMeters > 0 ? totalWeight / distanceInMeters : 0;
    
    // Update UI with calculated values
    document.getElementById('totalDistanceCost').textContent = formatCurrency(totalDistanceCost);
    document.getElementById('totalGatesValue').textContent = formatCurrency(totalGatesValue);
    document.getElementById('materialCost').textContent = formatCurrency(materialAllocation);
    document.getElementById('installationCost').textContent = formatCurrency(installationAllocation + (includeInstallation ? gateInstallationCost : 0));
    
    // Update gate cost boxes
    document.getElementById('gateMaterialCostValue').textContent = formatCurrency(gateMaterialCost);
    document.getElementById('gateInstallationCostValue').textContent = formatCurrency(gateInstallationCost);
    
    // Update detailed breakdown
    document.getElementById('distanceCostDetail').textContent = formatCurrency(totalDistanceCost);
    document.getElementById('gatesValueDetail').textContent = formatCurrency(totalGatesValue);
    document.getElementById('materialAllocation').textContent = formatCurrency(materialAllocation);
    document.getElementById('fenceCost').textContent = formatCurrency(fenceCost);
    document.getElementById('postCost').textContent = formatCurrency(postCost);
    document.getElementById('individualPostCostDetail').textContent = formatCurrency(individualPostCost);
    document.getElementById('installationCostDetail').textContent = formatCurrency(installationAllocation);
    
    // Update gate breakdown in detailed table
    document.getElementById('gateMaterialDetail').textContent = formatCurrency(gateMaterialCost);
    document.getElementById('gateInstallationDetail').textContent = formatCurrency(gateInstallationCost);
    
    // Remove old gate installation cost entry
    document.getElementById('grandTotal').textContent = formatCurrency(grandTotal);
    
    // Update percentages in the breakdown table
    document.getElementById('materialPercentage').textContent = (materialPercentage * 100) + '%';
    document.getElementById('installationPercentage').textContent = (installationPercentage * 100) + '%';
    
    // Update cost breakdown section
    document.getElementById('costPerKm').textContent = formatCurrency(fenceCost);
    document.getElementById('costPerPost').textContent = formatCurrency(postCost);
    document.getElementById('individualPostCost').textContent = formatCurrency(individualPostCost);
    
    // Update cost per linear meter
    document.getElementById('costPerLM').textContent = formatCurrency(costPerLM);
    document.getElementById('costPerLMDetail').textContent = formatCurrency(costPerLM);
    
    // Update weight summary
    document.getElementById('displayTotalPostWeight').textContent = formatWeight(totalPostWeight);
    document.getElementById('displayTotalGateWeight').textContent = formatWeight(totalGateWeight);
    document.getElementById('displayTotalWeight').textContent = formatWeight(totalWeight);
    document.getElementById('displayWeightPerLM').textContent = formatWeight(weightPerLM);
    
    // Update gate cost cards visibility
    updateGateCostCards();
}

// Print Function
function printReport() {
    window.print();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if already authenticated
    if (sessionStorage.getItem('authenticated') === 'true') {
        document.getElementById('password-protection').style.display = 'none';
        document.querySelector('.container').style.display = 'block';
    }
    
    // Allow pressing Enter to submit password
    document.getElementById('password-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });
    
    // Initialize with gate rows
    addGateRow("DLS");
    addGateRow("SLS");
    calculateCosts();
    
    // Event Listeners
    const calculateBtn = document.getElementById('calculateBtn');
    const printBtn = document.getElementById('printBtn');
    
    calculateBtn.addEventListener('click', calculateCosts);
    printBtn.addEventListener('click', printReport);
    
    // Add event listeners to input fields for real-time calculation
    const inputFields = [
        'distance', 'rate', 'postQty', 'totalPostWeightInput'
    ];
    inputFields.forEach(field => {
        document.getElementById(field).addEventListener('input', calculateCosts);
    });
    
    // Add event listeners to gate inputs
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('gate-rate') || 
            e.target.classList.contains('gate-quantity') || 
            e.target.classList.contains('gate-weight')) {
            calculateCosts();
        }
    });
    
    // Add event listener to installation checkbox
    document.getElementById('installation').addEventListener('change', function() {
        calculateCosts();
        updateGateCostCards();
    });
    
    // Add event listeners for collapsible sections
    document.getElementById('materialBreakdownHeader').addEventListener('click', function() {
        toggleCollapsible('materialBreakdownContent', 'materialBreakdownHeader');
    });
    
    document.getElementById('weightSummaryHeader').addEventListener('click', function() {
        toggleCollapsible('weightSummaryContent', 'weightSummaryHeader');
    });
    
    document.getElementById('gateDetailsHeader').addEventListener('click', function() {
        toggleCollapsible('gateDetailsContent', 'gateDetailsHeader');
    });
    
    document.getElementById('gateBreakdownHeader').addEventListener('click', function() {
        toggleCollapsible('gateBreakdownContent', 'gateBreakdownHeader');
    });
});