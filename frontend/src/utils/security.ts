/**
 * Client-side security utilities for Market Motors application
 * Handles CSRF tokens, secure API requests, and XSS prevention
 */

import { logger } from './logger';

// CSRF token storage
let csrfToken: string | null = null;

/**
 * Fetches CSRF token from the server
 */
export const fetchCsrfToken = async (): Promise<string | null> => {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = await response.json();
    csrfToken = data.token;

    logger.info('CSRF token fetched successfully');
    return csrfToken;
  } catch (error) {
    logger.error('Failed to fetch CSRF token', error);
    return null;
  }
};

/**
 * Gets the current CSRF token, fetching it if not available
 */
export const getCsrfToken = async (): Promise<string | null> => {
  if (!csrfToken) {
    return await fetchCsrfToken();
  }
  return csrfToken;
};

/**
 * Clears the stored CSRF token (e.g., on logout)
 */
export const clearCsrfToken = (): void => {
  csrfToken = null;
};

/**
 * Creates secure request headers with CSRF token
 */
export const createSecureHeaders = async (
  additionalHeaders: Record<string, string> = {}
): Promise<Record<string, string>> => {
  const token = await getCsrfToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  if (token) {
    headers['X-CSRF-Token'] = token;
  }

  return headers;
};

/**
 * Secure fetch wrapper that automatically includes CSRF tokens
 */
export const secureFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const method = options.method || 'GET';
  const needsCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
    method.toUpperCase()
  );

  if (needsCsrf) {
    const secureHeaders = await createSecureHeaders(
      (options.headers as Record<string, string>) || {}
    );

    options.headers = secureHeaders;
  }

  // Always include credentials for session management
  options.credentials = options.credentials || 'include';

  try {
    const response = await fetch(url, options);

    // Handle CSRF token expiration
    if (response.status === 403 && needsCsrf) {
      logger.warn('CSRF token may have expired, refetching...');

      // Clear old token and retry once
      clearCsrfToken();
      const newHeaders = await createSecureHeaders(
        (options.headers as Record<string, string>) || {}
      );

      options.headers = newHeaders;
      return await fetch(url, options);
    }

    return response;
  } catch (error) {
    logger.error('Secure fetch failed', error);
    throw error;
  }
};

/**
 * Sanitizes user input to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

/**
 * Validates that a string is safe for HTML attribute values
 */
export const sanitizeAttribute = (input: string): string => {
  return input.replace(/[<>'"&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    };
    return entities[char] || char;
  });
};

/**
 * Content Security Policy utilities
 */
export const cspUtils = {
  /**
   * Creates a nonce for inline scripts (if needed)
   */
  generateNonce: (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  },

  /**
   * Validates that a URL is safe for external resources
   */
  validateUrl: (url: string): boolean => {
    try {
      const parsedUrl = new URL(url);
      const allowedProtocols = ['http:', 'https:', 'data:'];
      const allowedDomains = [
        'localhost',
        '127.0.0.1',
        'market-motors.com', // Add your production domain
      ];

      if (!allowedProtocols.includes(parsedUrl.protocol)) {
        return false;
      }

      if (
        parsedUrl.protocol !== 'data:' &&
        !allowedDomains.some(
          (domain) =>
            parsedUrl.hostname === domain ||
            parsedUrl.hostname.endsWith(`.${domain}`)
        )
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Input validation utilities
 */
export const inputValidation = {
  /**
   * Validates email format
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  /**
   * Validates password strength
   */
  isStrongPassword: (
    password: string
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  /**
   * Sanitizes file names for upload
   */
  sanitizeFileName: (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 255);
  },

  /**
   * Validates file type for uploads
   */
  isValidFileType: (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
  },

  /**
   * Validates file size
   */
  isValidFileSize: (file: File, maxSizeInMB: number): boolean => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  },
};

/**
 * Security event reporting
 */
export const securityReporting = {
  /**
   * Reports a security incident to the server
   */
  reportIncident: async (incident: {
    type:
      | 'xss_attempt'
      | 'csrf_failure'
      | 'suspicious_activity'
      | 'unauthorized_access'
      | 'csp_violation';
    details: string;
    userAgent?: string;
    url?: string;
  }): Promise<void> => {
    try {
      await secureFetch('/api/security/incident', {
        method: 'POST',
        body: JSON.stringify({
          ...incident,
          timestamp: new Date().toISOString(),
          userAgent: incident.userAgent || navigator.userAgent,
          url: incident.url || window.location.href,
        }),
      });
    } catch (error) {
      logger.error('Failed to report security incident', error);
    }
  },

  /**
   * Reports a Content Security Policy violation
   */
  reportCspViolation: (violationEvent: SecurityPolicyViolationEvent): void => {
    const violation = {
      type: 'csp_violation' as const,
      details: JSON.stringify({
        blockedURI: violationEvent.blockedURI,
        violatedDirective: violationEvent.violatedDirective,
        originalPolicy: violationEvent.originalPolicy,
        sourceFile: violationEvent.sourceFile,
        lineNumber: violationEvent.lineNumber,
        columnNumber: violationEvent.columnNumber,
      }),
    };

    securityReporting.reportIncident(violation);
  },
};

/**
 * Initialize security monitoring
 */
export const initializeSecurity = (): void => {
  // Set up CSP violation reporting
  document.addEventListener(
    'securitypolicyviolation',
    securityReporting.reportCspViolation
  );

  // Monitor for potential XSS attempts
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name: string, value: string) {
    if (name.toLowerCase().startsWith('on') && value.includes('javascript:')) {
      securityReporting.reportIncident({
        type: 'xss_attempt',
        details: `Attempted to set ${name} with suspicious value: ${value}`,
      });
      return;
    }
    return originalSetAttribute.call(this, name, value);
  };

  // Fetch initial CSRF token
  fetchCsrfToken().catch((error) => {
    logger.error('Failed to initialize CSRF token', error);
  });

  logger.info('Security monitoring initialized');
};

/**
 * Cleanup security monitoring (e.g., on component unmount)
 */
export const cleanupSecurity = (): void => {
  document.removeEventListener(
    'securitypolicyviolation',
    securityReporting.reportCspViolation
  );
  clearCsrfToken();
};

// Export default security configuration
export const securityConfig = {
  csrfTokenEndpoint: '/api/csrf-token',
  maxFileUploadSize: 10, // MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'text/plain'],
  passwordMinLength: 8,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};
