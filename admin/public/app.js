// GSO Admin Panel - JavaScript

// Use current hostname and port for API calls (works on localhost and network)
const API_BASE = `${window.location.protocol}//${window.location.hostname}:${window.location.port || 3000}/api`;

// Track if we're in edit mode
let editMode = false;
let currentEditCcr = null;

// Store all certificates for client-side search
let allCertificates = [];

// DOM Ready
$(document).ready(function() {
    loadCertificates();
    setupFormHandler();
    setDefaultValues();
    setupVinMasking();
    setupSearchInput();
    loadLogos();
});

// Generate a random 6-digit CCR number
function generateCcrNumber() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Mask VIN: keep first 8 chars, 9th becomes *, keep 10th, last 7 become *
// Example: LSJA36U38T1234567 -> LSJA36U3*T*******
function maskVin(vin) {
    if (!vin || vin.length < 10) return vin;
    const upper = vin.toUpperCase();
    const first8 = upper.substring(0, 8);
    const char10 = upper.charAt(9);
    return first8 + '*' + char10 + '*'.repeat(Math.max(0, upper.length - 10));
}

// Setup VIN input masking
function setupVinMasking() {
    $('#vinFull').on('input', function() {
        const raw = $(this).val().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
        $(this).val(raw);
        
        if (raw.length >= 10) {
            const masked = maskVin(raw);
            $('#vin').val(masked);
            $('#vinPreview').text('Masked: ' + masked).show();
        } else if (raw.length > 0) {
            $('#vin').val(raw);
            $('#vinPreview').text('Enter full 17-char VIN for masking').show();
        } else {
            $('#vin').val('');
            $('#vinPreview').hide();
        }
    });
}

// Setup live search
function setupSearchInput() {
    let searchTimeout;
    $('#searchCcr').on('input', function() {
        clearTimeout(searchTimeout);
        const query = $(this).val().trim();
        if (query.length === 0) {
            $('#searchResults').hide();
            $('#searchResult').hide();
            return;
        }
        searchTimeout = setTimeout(() => searchCertificate(), 200);
    });
}

// Set default values for common fields
function setDefaultValues() {
    const currentYear = new Date().getFullYear();
    $('#modelYear').attr('placeholder', `e.g. ${currentYear}`);
    $('#productionYear').attr('placeholder', `e.g. ${currentYear}`);
    
    // Set current date for approval
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const today = new Date();
    const dateStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    $('#approvedOn').attr('placeholder', dateStr);

    // Auto-generate CCR number
    if (!editMode) {
        $('#ccrNumber').val(generateCcrNumber());
    }
}

// Setup form submission handler
function setupFormHandler() {
    $('#vehicleForm').on('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        
        // Show loading state
        const actionText = editMode ? 'Updating...' : 'Generating...';
        submitBtn.prop('disabled', true).html(`<i class="fa fa-spinner fa-spin mr-2"></i>${actionText}`);
        
        try {
            const formData = collectFormData();
            
            const response = await fetch(`${API_BASE}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                const action = editMode ? 'updated' : 'generated';
                
                if (result.warning) {
                    showToast(`Certificate ${action}, but check warnings: ${result.warning}`, 'warning');
                    alert(`Warning: ${result.warning}`);
                } else {
                    showToast(`Certificate ${formData.ccrNumber} ${action} successfully! (EN + AR)`, 'success');
                }
                
                loadCertificates();
                
                // Reset form if in edit mode
                if (editMode) {
                    cancelEdit();
                }
                
                // Ask which version to preview (local)
                const localChoice = confirm(`Certificate ${action}!

English: ${result.files.english}
Arabic: ${result.files.arabic}

Click OK to preview English version (Local)
Click Cancel to preview Arabic version (Local)`);
                
                const previewBase = `${window.location.protocol}//${window.location.hostname}:${window.location.port || 3000}/www.gso.org.sa/cc/v/`;
                if (localChoice) {
                    window.open(`${previewBase}${formData.ccrNumber}.html`, '_blank');
                } else {
                    window.open(`${previewBase}${formData.ccrNumber}d6cc.html`, '_blank');
                }
                
                // Ask if user wants to open deployed version
                setTimeout(() => {
                    if (confirm(`Would you like to open the deployed version?\n\n(Note: Only works if already deployed)`)) {
                        const isArabic = !confirm(`Click OK for English version\nClick Cancel for Arabic version`);
                        openDeployedCertificate(formData.ccrNumber, isArabic);
                    }
                }, 500);
            } else {
                showToast(result.error || `Failed to ${editMode ? 'update' : 'generate'} certificate`, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error. Make sure the server is running.', 'error');
        } finally {
            submitBtn.prop('disabled', false).html(originalText);
        }
    });
}

// Collect all form data
function collectFormData() {
    return {
        // Basic Information
        ccrNumber: $('#ccrNumber').val().trim(),
        approvedOn: $('#approvedOn').val().trim(),
        manufacturer: $('#manufacturer').val().trim(),
        carLogo: $('#carLogo').val(),
        vehicleDescription: $('#vehicleDescription').val().trim(),
        
        // Classification
        category: $('#category').val(),
        modelYear: $('#modelYear').val() || '',
        countryOfProduction: $('#countryOfProduction').val(),
        productionMonth: $('#productionMonth').val() || '',
        productionYear: $('#productionYear').val() || '',
        vin: $('#vin').val().trim(),
        
        // Weights
        maxVehicleWeight: $('#maxVehicleWeight').val() || '',
        curbWeight: $('#curbWeight').val() || '',
        frontAxleWeight: $('#frontAxleWeight').val() || '',
        rearAxleWeight: $('#rearAxleWeight').val() || '',
        
        // Dimensions
        length: $('#length').val() || '',
        width: $('#width').val() || '',
        height: $('#height').val() || '',
        wheelbase: $('#wheelbase').val() || '',
        trackFront: $('#trackFront').val() || '',
        trackRear: $('#trackRear').val() || '',
        
        // Body & Seating
        chassisType: $('#chassisType').val(),
        passengers: $('#passengers').val() || '',
        
        // Engine
        engineType: $('#engineType').val(),
        cylinders: $('#cylinders').val() || '',
        displacement: $('#displacement').val() || '',
        airIntake: $('#airIntake').val(),
        enginePower: $('#enginePower').val() || '',
        engineRpm: $('#engineRpm').val() || '',
        pollutantLimit: $('#pollutantLimit').val(),
        
        // Transmission & Safety
        transmission: $('#transmission').val(),
        eCallSystem: $('#eCallSystem').val(),
        
        // Brakes
        serviceBrakes: $('#serviceBrakes').val(),
        emergencyBrakes: $('#emergencyBrakes').val(),
        
        // Fuel Economy
        vehicleClass: $('#vehicleClass').val(),
        fuelEconomy: $('#fuelEconomy').val() || '',
        fuelEconomyRating: $('#fuelEconomyRating').val(),
        
        // Additional Info
        additionalInfo: $('#additionalInfo').val().trim()
    };
}

// Load certificates list
async function loadCertificates() {
    const listContainer = $('#certificatesList');
    
    try {
        const response = await fetch(`${API_BASE}/certificates`);
        
        // Handle non-OK responses
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        let certificates;
        try {
            certificates = await response.json();
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Invalid response from server');
        }
        
        // Store for search
        allCertificates = certificates;
        
        if (!Array.isArray(certificates) || certificates.length === 0) {
            listContainer.html(`
                <div class="empty-state">
                    <i class="fa fa-folder-open-o"></i>
                    <p>No certificates yet</p>
                </div>
            `);
            $('#totalCertificates').text('0');
            return;
        }
        
        $('#totalCertificates').text(certificates.length);
        
        renderCertificatesList(certificates.slice(0, 15), listContainer);
        
    } catch (error) {
        console.error('Error loading certificates:', error);
        listContainer.html(`
            <div class="empty-state">
                <i class="fa fa-exclamation-triangle"></i>
                <p>Failed to load certificates<br><small>Make sure the server is running</small></p>
            </div>
        `);
    }
}

// Render certificates list (reusable for main list and search results)
function renderCertificatesList(certificates, container) {
    // Get base URL for certificate previews
    const baseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port || 3000}`;
    
    const html = certificates.map(cert => {
        const carLabel = cert.vehicleDescription 
        ? `<div class="certificate-car-name" title="${cert.vehicleDescription}">${cert.vehicleDescription}</div>` 
        : '';
    
    return `
        <div class="certificate-item" data-ccr="${cert.ccrNumber}">
            <div class="certificate-info">
                <div class="certificate-ccr">#${cert.ccrNumber}</div>
                ${carLabel}
                <div class="certificate-date">${formatDate(cert.modifiedAt)}</div>
            </div>
                <div class="certificate-actions">
                    <a href="${baseUrl}/www.gso.org.sa/cc/v/${cert.ccrNumber}.html" 
                       target="_blank" 
                       class="btn btn-sm btn-primary"
                       title="Preview English (Local)">
                        EN
                    </a>
                    ${cert.arabicFile ? `<a href="${baseUrl}/www.gso.org.sa/cc/v/${cert.ccrNumber}d6cc.html" 
                       target="_blank" 
                       class="btn btn-sm btn-info"
                       title="Preview Arabic (Local)">
                        AR
                    </a>` : ''}
                    <button class="btn btn-sm btn-success" 
                            onclick="openDeployedCertificate('${cert.ccrNumber}', false)"
                            title="Open Deployed English">
                        <i class="fa fa-globe"></i> EN
                    </button>
                    ${cert.arabicFile ? `<button class="btn btn-sm btn-success" 
                            onclick="openDeployedCertificate('${cert.ccrNumber}', true)"
                            title="Open Deployed Arabic">
                        <i class="fa fa-globe"></i> AR
                    </button>` : ''}
                    <button class="btn btn-sm btn-warning" 
                            onclick="editCertificate('${cert.ccrNumber}')"
                            title="Edit Certificate">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            onclick="deleteCertificate('${cert.ccrNumber}')"
                            title="Delete Certificate">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.html(html);
}

// Delete certificate
async function deleteCertificate(ccrNumber) {
    if (!confirm(`Are you sure you want to delete certificate #${ccrNumber}?\n\nBoth English and Arabic versions will be deleted.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/certificates/${ccrNumber}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showToast(`Certificate #${ccrNumber} deleted (EN + AR)`, 'success');
            loadCertificates();
        } else {
            showToast(result.error || 'Failed to delete certificate', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error', 'error');
    }
}

// Format date for display
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = $('#toast');
    toast.removeClass('success error warning').addClass(type);
    
    // Determine icon based on type
    let icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.find('.toast-body').html(`
        <i class="fa ${icon} mr-2"></i>
        ${message}
    `);
    toast.addClass('show');
    
    setTimeout(() => {
        toast.removeClass('show');
    }, 4000);
}

// Get deployed certificate URL
function getDeployedUrl(ccrNumber, isArabic = false) {
    const suffix = isArabic ? 'd6cc.html' : '.html';
    return `https://gso-sa.web.app/www.gso.org.sa/cc/v/${ccrNumber}${suffix}`;
}

// Open deployed certificate
function openDeployedCertificate(ccrNumber, isArabic = false) {
    const url = getDeployedUrl(ccrNumber, isArabic);
    window.open(url, '_blank');
}

// Make functions globally accessible
window.deleteCertificate = deleteCertificate;
window.openDeployedCertificate = openDeployedCertificate;

// Deploy to Firebase
async function deployToFirebase() {
    const deployBtn = $('#deployBtn');
    const deployStatus = $('#deployStatus');
    const deployMessage = $('#deployMessage');
    
    // Confirm before deploy
    if (!confirm('Are you sure you want to deploy all certificates to Firebase?\n\nThis will push all changes to the live website.')) {
        return;
    }
    
    // Show loading state
    deployBtn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin mr-2"></i>Deploying...');
    deployStatus.show();
    deployMessage.text('Running firebase deploy... This may take a minute.');
    
    try {
        const response = await fetch(`${API_BASE}/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            deployMessage.html('<i class="fa fa-check-circle mr-2"></i>Deployment successful!');
            deployStatus.find('.alert').removeClass('alert-info').addClass('alert-success');
            showToast('Firebase deployment completed successfully!', 'success');
            
            // Show hosting URL if available
            if (result.output && result.output.includes('Hosting URL:')) {
                const urlMatch = result.output.match(/Hosting URL: (https:\/\/[^\s]+)/);
                if (urlMatch) {
                    setTimeout(() => {
                        if (confirm(`Deployment successful!\n\nLive URL: ${urlMatch[1]}\n\nWould you like to open it?`)) {
                            window.open(urlMatch[1], '_blank');
                        }
                    }, 500);
                }
            }
            
            // Ask if user wants to open a specific certificate
            setTimeout(() => {
                const ccrNumber = prompt('Deployment successful!\n\nEnter a CCR number to open the deployed certificate (or click Cancel):');
                if (ccrNumber && ccrNumber.trim()) {
                    const choice = confirm(`Open certificate #${ccrNumber.trim()}?\n\nClick OK for English version\nClick Cancel for Arabic version`);
                    openDeployedCertificate(ccrNumber.trim(), !choice);
                }
            }, 1000);
        } else {
            deployMessage.html(`<i class="fa fa-exclamation-circle mr-2"></i>Deployment failed: ${result.error}`);
            deployStatus.find('.alert').removeClass('alert-info').addClass('alert-danger');
            showToast('Deployment failed. Check console for details.', 'error');
            console.error('Deploy error:', result);
        }
    } catch (error) {
        console.error('Error:', error);
        deployMessage.html('<i class="fa fa-exclamation-circle mr-2"></i>Network error');
        deployStatus.find('.alert').removeClass('alert-info').addClass('alert-danger');
        showToast('Network error. Make sure the server is running.', 'error');
    } finally {
        deployBtn.prop('disabled', false).html('<i class="fa fa-rocket mr-2"></i>Deploy Now');
    }
}

// Make deployToFirebase globally accessible
window.deployToFirebase = deployToFirebase;

// Search for a certificate - supports CCR number, car name, and first 7 VIN digits
async function searchCertificate() {
    const query = $('#searchCcr').val().trim().toUpperCase();
    const searchResult = $('#searchResult');
    const searchResults = $('#searchResults');
    const searchResultText = $('#searchResultText');
    const loadEditBtn = $('#loadEditBtn');
    
    if (!query) {
        searchResult.hide();
        searchResults.hide();
        return;
    }
    
    // First try exact CCR match via API
    try {
        const response = await fetch(`${API_BASE}/certificates/${query}`);
        
        if (response.ok) {
            const data = await response.json();
            searchResult.show();
            searchResultText.html(`Certificate #${query} found!`);
            searchResult.find('.alert').removeClass('alert-danger').addClass('alert-success');
            loadEditBtn.show().data('ccr', query);
            searchResults.hide();
            return;
        }
    } catch (e) {
        // Not an exact CCR match, continue to fuzzy search
    }

    // Fuzzy search across allCertificates: CCR, vehicle description, VIN (first 7)
    const matches = allCertificates.filter(cert => {
        const ccr = (cert.ccrNumber || '').toUpperCase();
        const desc = (cert.vehicleDescription || '').toUpperCase();
        const vin = (cert.vin || '').toUpperCase();
        const vinFirst7 = vin.substring(0, 7);
        
        return ccr.includes(query) || 
               desc.includes(query) || 
               (query.length >= 3 && vinFirst7.includes(query));
    });
    
    searchResult.hide();
    
    if (matches.length > 0) {
        const baseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port || 3000}`;
        const html = matches.slice(0, 10).map(cert => {
            const carName = cert.vehicleDescription || 'Unknown vehicle';
            const vinDisplay = cert.vin ? ` | VIN: ${cert.vin.substring(0, 7)}...` : '';
            return `
                <div class="search-match-item" style="padding: 8px 12px; border-bottom: 1px solid #eee; cursor: pointer;" 
                     onclick="editCertificate('${cert.ccrNumber}')" 
                     title="Click to edit">
                    <div style="font-weight: 600; color: #0066cc;">#${cert.ccrNumber}</div>
                    <div style="font-size: 12px; color: #555;">${carName}${vinDisplay}</div>
                </div>
            `;
        }).join('');
        
        searchResults.html(`
            <div style="background: white; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="padding: 6px 12px; background: #f0f0f0; font-size: 11px; color: #888; border-bottom: 1px solid #ddd;">
                    ${matches.length} result${matches.length > 1 ? 's' : ''} found
                </div>
                ${html}
            </div>
        `).show();
    } else {
        searchResults.html(`
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 10px 14px; font-size: 13px; color: #856404;">
                <i class="fa fa-info-circle mr-1"></i> No certificates match "${query}"
            </div>
        `).show();
    }
}

// Load certificate for editing
async function loadCertificateForEdit() {
    const ccrNumber = $('#loadEditBtn').data('ccr');
    if (!ccrNumber) return;
    
    await editCertificate(ccrNumber);
}

// Edit certificate - load data into form
async function editCertificate(ccrNumber) {
    try {
        const response = await fetch(`${API_BASE}/certificates/${ccrNumber}`);
        
        if (!response.ok) {
            let errorMessage = 'Certificate not found';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            showToast(errorMessage, 'error');
            console.error('Error response:', response.status, errorMessage);
            return;
        }
        
        let data;
        try {
            data = await response.json();
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            showToast('Error parsing certificate data', 'error');
            return;
        }
        
        // Populate form with certificate data
        $('#ccrNumber').val(data.ccrNumber || '').prop('readonly', true);
        $('#approvedOn').val(data.approvedOn || '');
        $('#manufacturer').val(data.manufacturer || '');
        if (data.carLogo) {
            $('#carLogo').val(data.carLogo).trigger('change');
        } else {
            $('#carLogo').val('');
            $('#carLogoPreview').hide();
        }
        $('#vehicleDescription').val(data.vehicleDescription || '');
        $('#category').val(data.category || 'Passenger Car');
        $('#modelYear').val(data.modelYear || '');
        $('#countryOfProduction').val(data.countryOfProduction || 'JAPAN');
        $('#productionMonth').val(data.productionMonth || '');
        $('#productionYear').val(data.productionYear || '');
        
        // VIN: show masked value; put full VIN in hidden field
        const vinValue = data.vin || '';
        $('#vin').val(vinValue);
        $('#vinFull').val(vinValue);
        if (vinValue) {
            $('#vinPreview').text('Masked VIN: ' + vinValue).show();
        } else {
            $('#vinPreview').hide();
        }
        
        $('#maxVehicleWeight').val(data.maxVehicleWeight || '');
        $('#curbWeight').val(data.curbWeight || '');
        $('#frontAxleWeight').val(data.frontAxleWeight || '');
        $('#rearAxleWeight').val(data.rearAxleWeight || '');
        $('#length').val(data.length || '');
        $('#width').val(data.width || '');
        $('#height').val(data.height || '');
        $('#wheelbase').val(data.wheelbase || '');
        $('#trackFront').val(data.trackFront || '');
        $('#trackRear').val(data.trackRear || '');
        $('#chassisType').val(data.chassisType || 'Monocoque');
        $('#passengers').val(data.passengers || '');
        $('#engineType').val(data.engineType || 'Petrol');
        $('#cylinders').val(data.cylinders || '');
        $('#displacement').val(data.displacement || '');
        $('#airIntake').val(data.airIntake || 'Naturally Aspirated');
        $('#enginePower').val(data.enginePower || '');
        $('#engineRpm').val(data.engineRpm || '');
        $('#pollutantLimit').val(data.pollutantLimit || 'Euro 6');
        $('#transmission').val(data.transmission || 'Automatic');
        $('#eCallSystem').val(data.eCallSystem || 'Not Provided');
        $('#serviceBrakes').val(data.serviceBrakes || 'Hydraulic');
        $('#emergencyBrakes').val(data.emergencyBrakes || 'Combined with the service brake');
        $('#vehicleClass').val(data.vehicleClass || 'Passenger Car');
        $('#fuelEconomy').val(data.fuelEconomy || '');
        $('#fuelEconomyRating').val(data.fuelEconomyRating || 'Excellent');
        $('#additionalInfo').val(data.additionalInfo || 'Also comply with the National regulations for member countries mentioned in the Annex of the list of Technical Regulations for MV 2026 MY-D5, when exporting to those countries.');
        
        // Enable edit mode
        editMode = true;
        currentEditCcr = ccrNumber;
        $('#formTitle').html(`<i class="fa fa-edit mr-2"></i>Edit Certificate #${ccrNumber}`);
        $('#cancelEditBtn').show();
        $('button[type="submit"]').html('<i class="fa fa-save mr-2"></i>Update Certificate');
        
        // Scroll to form
        $('html, body').animate({
            scrollTop: $('.form-card').offset().top - 100
        }, 500);
        
        // Hide search results
        $('#searchResults').hide();
        $('#searchResult').hide();
        
        showToast(`Certificate #${ccrNumber} loaded for editing`, 'success');
        
    } catch (error) {
        console.error('Error loading certificate:', error);
        console.error('Error details:', error.message, error.stack);
        showToast(`Error loading certificate data: ${error.message}`, 'error');
    }
}

// Cancel edit mode
function cancelEdit() {
    editMode = false;
    currentEditCcr = null;
    $('#vehicleForm')[0].reset();
    $('#ccrNumber').prop('readonly', true);
    $('#formTitle').html('<i class="fa fa-plus-circle mr-2"></i>Add New Vehicle Certificate');
    $('#cancelEditBtn').hide();
    $('button[type="submit"]').html('<i class="fa fa-file-code-o mr-2"></i>Generate Certificate');
    $('#searchResult').hide();
    $('#searchResults').hide();
    $('#searchCcr').val('');
    $('#vinFull').val('');
    $('#vin').val('');
    $('#vinPreview').hide();
    
    // Reset additional info to default
    $('#additionalInfo').val('Also comply with the National regulations for member countries mentioned in the Annex of the list of Technical Regulations for MV 2026 MY-D5, when exporting to those countries.');
    
    setDefaultValues();
}

// Make functions globally accessible
window.searchCertificate = searchCertificate;
window.loadCertificateForEdit = loadCertificateForEdit;
window.editCertificate = editCertificate;
window.cancelEdit = cancelEdit;

// Load car logos
async function loadLogos() {
    try {
        const response = await fetch(`${API_BASE}/logos`);
        if (!response.ok) throw new Error('Failed to fetch logos');
        
        const logos = await response.json();
        const select = $('#carLogo');
        
        logos.forEach(logo => {
            select.append(`<option value="${logo}">${logo.replace('_logo', '').replace('.png', '').replace('.jpg', '').replace('.jpeg', '').toUpperCase()}</option>`);
        });
        
        select.on('change', function() {
            const val = $(this).val();
            if (val) {
                $('#carLogoPreview').attr('src', `/logos/${val}`).show();
            } else {
                $('#carLogoPreview').hide();
            }
        });
    } catch (error) {
        console.error('Error loading logos:', error);
    }
}
