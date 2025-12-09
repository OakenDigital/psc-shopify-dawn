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

        // Check if Forms app is enabled
        const useFormsApp = this.dataset.useFormsApp === 'true';
        const formsAppFormId = this.dataset.formsAppFormId;

        try {
          if (useFormsApp && formsAppFormId) {
            // Submit to Forms app API
            await this.submitToFormsApp(formsAppFormId);
          } else {
            // Submit via standard contact form
            await this.submitToContactForm();
          }
        } catch (error) {
          console.error('Error submitting form:', error);
          this.setLoadingState(false);
          alert('There was an error submitting your registration. Please try again or contact support.');
        }
      }

      async submitToContactForm() {
        const formData = new FormData(this.form);
        const response = await fetch(this.form.action, {
          method: 'POST',
          body: formData,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        if (response.ok) {
          window.location.reload();
        } else {
          throw new Error('Form submission failed');
        }
      }

      async submitToFormsApp(formInstanceId) {
        // Get shop domain from data attribute or fallback methods
        const shopDomain = this.dataset.shopDomain || window.Shopify?.shop || this.getShopDomainFromUrl();

        // Collect form data and map to Forms app format
        const formData = new FormData(this.form);
        const submissionData = {
          shopify_domain: shopDomain,
          form_instance_id: parseInt(formInstanceId),
          customer_consented_to_email_marketing: false,
          customer_consented_to_sms_marketing: false,
        };

        // Map form fields to Forms app format
        for (const [key, value] of formData.entries()) {
          if (key === 'contact[email]') {
            submissionData.email = value;
          } else if (key === 'contact[First Name]') {
            submissionData.first_name = value;
          } else if (key === 'contact[Last Name]') {
            submissionData.last_name = value;
          } else if (key === 'contact[Phone]') {
            submissionData.phone_number = value;
          } else if (key === 'contact[Order Number]') {
            submissionData['custom#order_number'] = value;
          } else if (key === 'contact[Product]' || key === 'contact[Product Other]') {
            submissionData['custom#product'] = value;
          } else if (key === 'contact[Serial Number]') {
            submissionData['custom#serial_number'] = value;
          } else if (key === 'contact[Purchase Date]') {
            submissionData['custom#purchase_date'] = value;
          } else if (key === 'contact[Address Line 1]') {
            submissionData['custom#address_line_1'] = value;
          } else if (key === 'contact[Address Line 2]') {
            submissionData['custom#address_line_2'] = value;
          } else if (key === 'contact[City]') {
            submissionData['custom#city'] = value;
          } else if (key === 'contact[State/Province]') {
            submissionData['custom#state'] = value;
          } else if (key === 'contact[ZIP/Postal Code]') {
            submissionData['custom#zippostal_code'] = value;
          } else if (key === 'contact[Country]') {
            submissionData['custom#country'] = value;
          } else if (key === 'contact[Additional Notes]') {
            submissionData['custom#additional_notes'] = value;
          }
        }

        // Handle product selection (custom dropdown vs text input)
        const productSelectInput = this.querySelector('[data-product-select]');
        if (productSelectInput) {
          // Check if it's the hidden input (custom dropdown) or regular input
          if (productSelectInput.type === 'hidden') {
            // Custom dropdown - get value from hidden input
            if (productSelectInput.value && productSelectInput.value !== 'other' && productSelectInput.value !== '') {
              submissionData['custom#product'] = productSelectInput.value;
            } else if (productSelectInput.value === 'other') {
              const productOther = this.querySelector('[data-product-other-input]');
              if (productOther && productOther.value) {
                submissionData['custom#product'] = productOther.value;
              }
            }
          } else {
            // Regular text input
            if (productSelectInput.value) {
              submissionData['custom#product'] = productSelectInput.value;
            }
          }
        }

        // Also check for product in formData (fallback)
        if (!submissionData['custom#product']) {
          const productFromForm = formData.get('contact[Product]') || formData.get('contact[Product Other]');
          if (productFromForm) {
            submissionData['custom#product'] = productFromForm;
          }
        }

        // Submit to Forms app API
        const response = await fetch('https://forms.shopifyapps.com//api/v2/form_submission', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(submissionData),
        });

        if (response.ok) {
          const result = await response.json().catch(() => ({}));
          // Redirect to success page or show success message
          const successUrl = new URL(window.location.href);
          successUrl.searchParams.set('form_status', 'success');
          if (result.id) {
            successUrl.searchParams.set('submission_id', result.id);
          }
          window.location.href = successUrl.toString();
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Forms app submission error:', errorData);
          console.error('Response status:', response.status, response.statusText);

          // Fallback to contact form if Forms app fails
          console.warn('Forms app submission failed, falling back to contact form');
          await this.submitToContactForm();
        }
      }

      getShopDomainFromUrl() {
        // Extract shop domain from current URL
        const hostname = window.location.hostname;
        if (hostname.includes('.myshopify.com')) {
          return hostname;
        }
        // Try to get from Shopify global object
        if (window.Shopify?.shop) {
          return window.Shopify.shop + '.myshopify.com';
        }
        // Fallback: try to extract from meta tags or other sources
        const shopMeta = document.querySelector('meta[name="shopify-checkout-api-token"]');
        if (shopMeta) {
          // Extract shop from various sources
          return hostname; // Best guess
        }
        return hostname;
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
