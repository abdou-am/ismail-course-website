(function () {
    const ROUTE_PREFIXES = {
        auth: '/api/auth',
        username: '/api/username',
        userpassword: '/api/userpassword',
        password: '/api/password',
        changestatusclient: '/api/changestatusclient',
        dashboardinformation: '/api/dashboardinformation',
        courses: '/api/courses',
        videos: '/api/videos',
        admin: '/api/admin',
    };

    let apiUrl = '';
    let courseSlug = '';
    let loadPromise = null;

    function normalizeUrl(value) {
        const normalized = String(value || '').trim();
        if (!normalized) {
            return '';
        }

        return normalized.replace(/\/+$/, '');
    }

    function hasKey(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    }

    function getNonEmptyValue(parsed, key) {
        if (!hasKey(parsed, key)) {
            return '';
        }

        return normalizeUrl(parsed[key]);
    }

    function getProcessEnv() {
        if (typeof globalThis === 'undefined') {
            return {};
        }

        const proc = globalThis.process;
        if (!proc || typeof proc !== 'object' || !proc.env || typeof proc.env !== 'object') {
            return {};
        }

        return proc.env;
    }

    function readConfigFromProcessEnv() {
        const env = getProcessEnv();

        apiUrl =
            getNonEmptyValue(env, 'URL') ||
            getNonEmptyValue(env, 'BACK_URL') ||
            getNonEmptyValue(env, 'VITE_URL') ||
            getNonEmptyValue(env, 'NEXT_PUBLIC_URL');

        const slug = String(env.COURSE_SLUG || '').trim();
        if (slug) {
            courseSlug = slug;
        }
    }

    function requireApiBaseUrl() {
        const resolved = normalizeUrl(apiUrl);
        if (resolved) {
            return resolved;
        }

        const fallbackOrigin = normalizeUrl(typeof window !== 'undefined' && window.location ? window.location.origin : '');
        if (fallbackOrigin) {
            return fallbackOrigin;
        }

        return '';
    }

    function authHeaders() {
        const token = localStorage.getItem('token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async function api(path, options) {
        const baseUrl = requireApiBaseUrl();
        const requestOptions = options || {};
        const headers = {
            ...(requestOptions.headers || {}),
            ...authHeaders(),
        };

        if (!(requestOptions.body instanceof FormData) && !hasKey(headers, 'Content-Type')) {
            headers['Content-Type'] = 'application/json';
        }

        const res = await fetch(`${baseUrl}${path}`, {
            ...requestOptions,
            headers,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.message || 'Erreur serveur');
        }

        return data;
    }

    async function load() {
        if (loadPromise) {
            return loadPromise;
        }

        loadPromise = (async () => {
            readConfigFromProcessEnv();

            return apiUrl;
        })();

        return loadPromise;
    }

    window.ENV_CONFIG = {
        load,
        getApiBaseUrl: () => apiUrl,
        requireApiBaseUrl,
        getCourseSlug: () => courseSlug,
        getRoutePrefixes: () => ({ ...ROUTE_PREFIXES }),
    };

    window.API_CLIENT = {
        authHeaders,
        api,
    };
})();
