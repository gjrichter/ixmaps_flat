/**
 * iXmaps Theme Configurator - Modern JavaScript Implementation
 * 
 * This file contains the main application logic for the theme configurator.
 * It uses ES6+ modules, modern async/await patterns, and follows best practices.
 */

// Import modules
import { ThemeManager } from './modules/ThemeManager.js';
import { UIManager } from './modules/UIManager.js';
import { DataManager } from './modules/DataManager.js';
import { ValidationManager } from './modules/ValidationManager.js';
import { NotificationManager } from './modules/NotificationManager.js';

/**
 * Main Application Class
 * Orchestrates all the different managers and handles the overall flow
 */
class ThemeConfigurator {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.config = {};
        this.managers = {};
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            // Initialize managers
            this.managers = {
                ui: new UIManager(this),
                theme: new ThemeManager(this),
                data: new DataManager(this),
                validation: new ValidationManager(this),
                notification: new NotificationManager()
            };

            // Initialize UI
            await this.managers.ui.init();
            
            // Load existing configuration if available
            await this.loadExistingConfig();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Show success message
            this.managers.notification.show('success', 'Theme Configurator loaded successfully!');
            
        } catch (error) {
            console.error('Failed to initialize Theme Configurator:', error);
            this.managers.notification.show('error', 'Failed to initialize application');
        }
    }

    /**
     * Load existing configuration from storage or parent window
     */
    async loadExistingConfig() {
        try {
            // Try to get configuration from parent window (ixmaps)
            if (window.parent && window.parent.ixmaps) {
                const parentConfig = window.parent.ixmaps.getThemeConfig();
                if (parentConfig) {
                    this.config = { ...this.config, ...parentConfig };
                    await this.managers.ui.populateForm(this.config);
                }
            }
            
            // Try to load from localStorage
            const savedConfig = localStorage.getItem('ixmaps-theme-config');
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsedConfig };
                await this.managers.ui.populateForm(this.config);
            }
        } catch (error) {
            console.warn('Could not load existing configuration:', error);
        }
    }

    /**
     * Set up event listeners for navigation and form interactions
     */
    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('[id^="next-step-"], [id^="prev-step-"]').forEach(button => {
            button.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Form inputs
        document.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('change', (e) => this.handleFormChange(e));
            input.addEventListener('input', (e) => this.handleFormInput(e));
        });

        // Theme type selection
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleThemeSelection(e));
        });

        // Action buttons
        document.getElementById('apply-theme')?.addEventListener('click', () => this.applyTheme());
        document.getElementById('reset-config')?.addEventListener('click', () => this.resetConfig());
        document.getElementById('save-config')?.addEventListener('click', () => this.saveConfig());

        // Edit buttons
        document.getElementById('edit-map-btn')?.addEventListener('click', () => this.editMapSource());
        document.getElementById('edit-data-btn')?.addEventListener('click', () => this.editDataSource());

        // Opacity slider
        const opacitySlider = document.getElementById('opacity');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => this.updateOpacityValue(e.target.value));
        }
    }

    /**
     * Handle navigation between steps
     */
    async handleNavigation(event) {
        const button = event.currentTarget;
        const isNext = button.id.includes('next-step');
        const stepNumber = parseInt(button.id.match(/\d+/)[0]);
        
        try {
            if (isNext) {
                // Validate current step before proceeding
                const isValid = await this.managers.validation.validateStep(this.currentStep);
                if (!isValid) {
                    this.managers.notification.show('warning', 'Please complete all required fields before proceeding');
                    return;
                }
                
                // Save current step data
                await this.saveStepData(this.currentStep);
                
                // Move to next step
                this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
            } else {
                // Move to previous step
                this.currentStep = Math.max(this.currentStep - 1, 1);
            }
            
            // Update UI
            await this.managers.ui.showStep(this.currentStep);
            this.managers.ui.updateProgress(this.currentStep);
            
        } catch (error) {
            console.error('Navigation error:', error);
            this.managers.notification.show('error', 'Failed to navigate between steps');
        }
    }

    /**
     * Handle form field changes
     */
    handleFormChange(event) {
        const field = event.target;
        const value = field.type === 'checkbox' ? field.checked : field.value;
        const fieldName = field.id;
        
        // Update configuration
        this.config[fieldName] = value;
        
        // Trigger validation
        this.managers.validation.validateField(fieldName, value);
        
        // Auto-save to localStorage
        this.autoSave();
    }

    /**
     * Handle form input (real-time updates)
     */
    handleFormInput(event) {
        const field = event.target;
        const fieldName = field.id;
        
        // Update configuration in real-time
        this.config[fieldName] = field.value;
        
        // Update preview if available
        this.updatePreview();
    }

    /**
     * Handle theme type selection
     */
    handleThemeSelection(event) {
        const option = event.currentTarget;
        const themeType = option.dataset.type;
        
        // Remove previous selection
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // Select new option
        option.classList.add('selected');
        
        // Update configuration
        this.config.themeType = themeType;
        
        // Update preview
        this.updatePreview();
        
        // Show success message
        this.managers.notification.show('success', `Selected theme type: ${themeType}`);
    }

    /**
     * Update opacity value display
     */
    updateOpacityValue(value) {
        const opacityValue = document.getElementById('opacity-value');
        if (opacityValue) {
            opacityValue.textContent = `${Math.round(value * 100)}%`;
        }
        
        // Update configuration
        this.config.opacity = parseFloat(value);
        
        // Update preview
        this.updatePreview();
    }

    /**
     * Save data for a specific step
     */
    async saveStepData(stepNumber) {
        const stepData = {};
        
        switch (stepNumber) {
            case 1:
                stepData.mapSource = document.getElementById('map-source')?.value || '';
                stepData.dataSource = document.getElementById('data-source')?.value || '';
                stepData.dataFields = Array.from(document.getElementById('data-fields')?.selectedOptions || [])
                    .map(option => option.value);
                break;
                
            case 2:
                stepData.lookupField = document.getElementById('lookup-field')?.value || '';
                stepData.latField = document.getElementById('lat-field')?.value || '';
                stepData.lonField = document.getElementById('lon-field')?.value || '';
                break;
                
            case 3:
                stepData.themeType = this.config.themeType || '';
                stepData.classification = document.getElementById('classification')?.value || '';
                stepData.numClasses = document.getElementById('num-classes')?.value || '4';
                stepData.colorScheme = this.config.colorScheme || [];
                break;
                
            case 4:
                stepData.showValues = document.getElementById('show-values')?.checked || false;
                stepData.enableShadow = document.getElementById('enable-shadow')?.checked || false;
                stepData.enableGlow = document.getElementById('enable-glow')?.checked || false;
                stepData.opacity = this.config.opacity || 0.8;
                stepData.title = document.getElementById('title')?.value || '';
                stepData.description = document.getElementById('description')?.value || '';
                stepData.units = document.getElementById('units')?.value || '';
                stepData.labelPosition = document.getElementById('label-position')?.value || 'center';
                break;
        }
        
        // Merge with existing config
        this.config = { ...this.config, ...stepData };
        
        // Auto-save
        this.autoSave();
    }

    /**
     * Update preview based on current configuration
     */
    updatePreview() {
        // This would integrate with the actual map preview
        // For now, we'll just log the current configuration
        console.log('Current configuration:', this.config);
    }

    /**
     * Apply the configured theme
     */
    async applyTheme() {
        try {
            // Show loading overlay
            this.managers.ui.showLoading(true);
            
            // Validate final configuration
            const isValid = await this.managers.validation.validateAll();
            if (!isValid) {
                this.managers.notification.show('error', 'Please complete all required fields');
                return;
            }
            
            // Save final step data
            await this.saveStepData(4);
            
            // Apply theme through theme manager
            await this.managers.theme.applyTheme(this.config);
            
            // Show success message
            this.managers.notification.show('success', 'Theme applied successfully!');
            
            // Hide loading overlay
            this.managers.ui.showLoading(false);
            
        } catch (error) {
            console.error('Failed to apply theme:', error);
            this.managers.notification.show('error', 'Failed to apply theme');
            this.managers.ui.showLoading(false);
        }
    }

    /**
     * Reset configuration to defaults
     */
    resetConfig() {
        if (confirm('Are you sure you want to reset all configuration? This cannot be undone.')) {
            this.config = {};
            this.managers.ui.resetForm();
            this.managers.ui.showStep(1);
            this.currentStep = 1;
            this.managers.ui.updateProgress(1);
            
            // Clear localStorage
            localStorage.removeItem('ixmaps-theme-config');
            
            this.managers.notification.show('info', 'Configuration reset to defaults');
        }
    }

    /**
     * Save configuration
     */
    async saveConfig() {
        try {
            // Save to localStorage
            localStorage.setItem('ixmaps-theme-config', JSON.stringify(this.config));
            
            // Try to save to parent window if available
            if (window.parent && window.parent.ixmaps) {
                await window.parent.ixmaps.saveThemeConfig(this.config);
            }
            
            this.managers.notification.show('success', 'Configuration saved successfully!');
            
        } catch (error) {
            console.error('Failed to save configuration:', error);
            this.managers.notification.show('error', 'Failed to save configuration');
        }
    }

    /**
     * Auto-save configuration to localStorage
     */
    autoSave() {
        try {
            localStorage.setItem('ixmaps-theme-config', JSON.stringify(this.config));
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }

    /**
     * Edit map source
     */
    editMapSource() {
        // This would open a map selection dialog
        this.managers.notification.show('info', 'Map source editor not implemented yet');
    }

    /**
     * Edit data source
     */
    editDataSource() {
        // This would open a data source selection dialog
        this.managers.notification.show('info', 'Data source editor not implemented yet');
    }

    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Set configuration
     */
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.autoSave();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance for debugging
    window.themeConfigurator = new ThemeConfigurator();
});

// Export for module usage
export { ThemeConfigurator };
