async function parseResponse(response) {
    const contentType =
        response.headers.get('content-type') || '';

    if (
        response.status === 204 ||
        !contentType.includes('application/json')
    ) {
        return null;
    }

    try {
        return await response.json();
    } catch {
        return null;
    }
}

export async function serverFetch(
    url,
    {
        method = 'GET',
        body = null,
        token = null,
        headers = {},
        parseJson = true,
    } = {}
) {
    const finalHeaders = {
        ...headers,
    };

    if (body !== null) {
        finalHeaders['Content-Type'] =
            'application/json';
    }

    if (token) {
        finalHeaders.Authorization =
            `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method,
        headers: finalHeaders,
        body:
            body !== null
                ? JSON.stringify(body)
                : undefined,
        cache: 'no-store',
    });

    const data = parseJson
        ? await parseResponse(response)
        : response;

    if (!response.ok) {
        throw {
            status: response.status,
            data,
        };
    }

    return data;
}