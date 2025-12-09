if (!customElements.get('product-registration-form')) {
  customElements.define(
    'product-registration-form',
    class ProductRegistrationForm extends HTMLElement {
      constructor() {
        super();
        this.form = this.querySelector('form');
        this.validateOrder = this.dataset.validateOrder === 'true';
        this.validateSerial = this.dataset.validateSerial === 'true';
        this.serialPattern = this.dataset.serialPattern || '^[A-Z0-9]{6,20}$';
        this.submitButton = this.querySelector('[data-submit-button]');
        this.buttonText = this.querySelector('[data-button-text]');
        this.buttonLoading = this.querySelector('[data-button-loading]');

        this.init();
      }

      init() {
        // Custom product dropdown handler
        this.initCustomProductSelect();

        // Product selection handler for "other" option
        const productSelect = this.querySelector('[data-product-select]');
        const productOther = this.querySelector('#ProductRegistrationForm-product-other');
        const productOtherInput = this.querySelector('[data-product-other-input]');

        if (productSelect && productOther) {
          // Listen for changes on the hidden input
          const observer = new MutationObserver(() => {
            this.handleProductChange(productSelect, productOther, productOtherInput);
          });

          observer.observe(productSelect, { attributes: true, attributeFilter: ['value'] });

          // Also listen for input events
          productSelect.addEventListener('input', () => {
            this.handleProductChange(productSelect, productOther, productOtherInput);
          });
        }

        // Order number validation
        const orderInput = this.querySelector('[data-order-input]');
        if (orderInput && this.validateOrder) {
          orderInput.addEventListener('blur', () => {
            this.validateOrderNumber(orderInput);
          });
          orderInput.addEventListener('input', () => {
            this.clearError(orderInput);
          });
        }

        // Serial number validation
        const serialInput = this.querySelector('[data-serial-input]');
        if (serialInput && this.validateSerial) {
          serialInput.addEventListener('blur', () => {
            this.validateSerialNumber(serialInput);
          });
          serialInput.addEventListener('input', () => {
            this.clearError(serialInput);
          });
        }

        // Form submission
        if (this.form) {
          this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        }
      }

      validateOrderNumber(input) {
        const value = input.value.trim();
        if (!value) return true;

        // Order number should be alphanumeric, 6-20 characters
        const orderPattern = /^[A-Z0-9]{6,20}$/i;
        if (!orderPattern.test(value)) {
          this.showError(input, 'Order number must be 6-20 alphanumeric characters');
          return false;
        }

        this.clearError(input);
        return true;
      }

      validateSerialNumber(input) {
        const value = input.value.trim();
        if (!value) return true;

        try {
          const regex = new RegExp(this.serialPattern);
          if (!regex.test(value)) {
            this.showError(input, 'Serial number format is invalid');
            return false;
          }
        } catch (e) {
          console.error('Invalid serial number pattern:', e);
          // Fallback to basic validation
          if (value.length < 4 || value.length > 30) {
            this.showError(input, 'Serial number must be between 4 and 30 characters');
            return false;
          }
        }

        this.clearError(input);
        return true;
      }

      showError(input, message) {
        const field = input.closest('.field');
        if (!field) return;

        const errorElement = field.querySelector('.product-registration__field-error');
        const errorText = field.querySelector('[data-order-error-text], [data-serial-error-text]');

        if (errorElement) {
          errorElement.style.display = 'block';
        }
        if (errorText) {
          errorText.textContent = message;
        }

        input.setAttribute('aria-invalid', 'true');
        input.classList.add('field__input--error');
      }

      clearError(input) {
        const field = input.closest('.field');
        if (!field) return;

        const errorElement = field.querySelector('.product-registration__field-error');

        if (errorElement) {
          errorElement.style.display = 'none';
        }

        input.removeAttribute('aria-invalid');
        input.classList.remove('field__input--error');
      }

      async onSubmitHandler(evt) {
        evt.preventDefault();

        // Validate all fields before submission
        let isValid = true;

        // Validate order number if enabled
        const orderInput = this.querySelector('[data-order-input]');
        if (orderInput && this.validateOrder && orderInput.value.trim()) {
          if (!this.validateOrderNumber(orderInput)) {
            isValid = false;
            orderInput.focus();
          }
        }

        // Validate serial number if enabled
        const serialInput = this.querySelector('[data-serial-input]');
        if (serialInput && this.validateSerial && serialInput.value.trim()) {
          if (!this.validateSerialNumber(serialInput)) {
            isValid = false;
            if (isValid) serialInput.focus();
          }
        }

        if (!isValid) {
          return;
        }

        // Show loading state
        this.setLoadingState(true);

        // Submit form
        try {
          const formData = new FormData(this.form);
          const response = await fetch(this.form.action, {
            method: 'POST',
            body: formData,
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
            },
          });

          if (response.ok) {
            // Form will reload with success message from Shopify
            // No need to handle here as Shopify handles it
          } else {
            throw new Error('Form submission failed');
          }
        } catch (error) {
          console.error('Error submitting form:', error);
          this.setLoadingState(false);
          // Shopify will show error message on page reload
        }
      }

      setLoadingState(loading) {
        if (loading) {
          this.submitButton.disabled = true;
          if (this.buttonText) this.buttonText.style.display = 'none';
          if (this.buttonLoading) this.buttonLoading.style.display = 'inline';
        } else {
          this.submitButton.disabled = false;
          if (this.buttonText) this.buttonText.style.display = 'inline';
          if (this.buttonLoading) this.buttonLoading.style.display = 'none';
        }
      }

      initCustomProductSelect() {
        const selectWrapper = this.querySelector('[data-product-select-wrapper]');
        if (!selectWrapper) return;

        const selectButton = selectWrapper.querySelector('[data-select-button]');
        const selectDropdown = selectWrapper.querySelector('[data-select-dropdown]');
        const selectInput = this.querySelector('[data-product-select]');
        const selectText = selectWrapper.querySelector('[data-select-text]');

        if (!selectButton || !selectDropdown || !selectInput) return;

        // Initialize button state - if input already has a value (e.g., from form reload)
        if (selectInput.value && selectInput.value !== '') {
          selectButton.setAttribute('data-has-value', 'true');
          selectWrapper.setAttribute('data-has-selection', 'true');
        }

        // Toggle dropdown
        selectButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isExpanded = selectButton.getAttribute('aria-expanded') === 'true';
          selectButton.setAttribute('aria-expanded', !isExpanded);
          selectDropdown.style.display = isExpanded ? 'none' : 'block';

          // Temporarily move label up when dropdown opens (even if empty)
          if (!isExpanded && !selectButton.hasAttribute('data-has-value')) {
            selectWrapper.setAttribute('data-dropdown-open', 'true');
          } else {
            selectWrapper.removeAttribute('data-dropdown-open');
          }
        });

        // Handle option selection
        const options = selectDropdown.querySelectorAll('[data-option-value]');
        options.forEach((option) => {
          option.addEventListener('click', () => {
            const value = option.getAttribute('data-option-value');
            const text = option.getAttribute('data-option-text');
            const image = option.getAttribute('data-option-image');

            // Update hidden input
            selectInput.value = value;
            selectInput.dispatchEvent(new Event('input', { bubbles: true }));

            // Update button text and image
            if (selectText) {
              selectText.textContent = text;

              // Update button to show selected image
              if (image && value !== '' && value !== 'other') {
                selectText.style.setProperty('--selected-image', `url(${image})`);
              } else {
                selectText.style.removeProperty('--selected-image');
              }
            }

            // Update button state for label positioning
            const selectWrapper = selectButton.closest('[data-product-select-wrapper]');
            if (value && value !== '') {
              selectButton.setAttribute('data-has-value', 'true');
              if (selectWrapper) selectWrapper.setAttribute('data-has-selection', 'true');
            } else {
              selectButton.removeAttribute('data-has-value');
              if (selectWrapper) selectWrapper.removeAttribute('data-has-selection');
            }

            // Update aria-selected
            options.forEach((opt) => opt.setAttribute('aria-selected', 'false'));
            option.setAttribute('aria-selected', 'true');

            // Close dropdown
            selectButton.setAttribute('aria-expanded', 'false');
            selectDropdown.style.display = 'none';
            selectWrapper.removeAttribute('data-dropdown-open');
          });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
          if (!selectWrapper.contains(e.target)) {
            selectButton.setAttribute('aria-expanded', 'false');
            selectDropdown.style.display = 'none';
            selectWrapper.removeAttribute('data-dropdown-open');
          }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && selectButton.getAttribute('aria-expanded') === 'true') {
            selectButton.setAttribute('aria-expanded', 'false');
            selectDropdown.style.display = 'none';
            selectWrapper.removeAttribute('data-dropdown-open');
            selectButton.focus();
          }
        });
      }

      handleProductChange(productSelect, productOther, productOtherInput) {
        if (productSelect.value === 'other') {
          if (productOther) productOther.style.display = 'block';
          if (productOtherInput) productOtherInput.required = true;
        } else {
          if (productOther) productOther.style.display = 'none';
          if (productOtherInput) {
            productOtherInput.required = false;
            productOtherInput.value = '';
          }
        }
      }
    }
  );
}
