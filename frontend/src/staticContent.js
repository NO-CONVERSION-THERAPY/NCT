let areaSelectorPayload = null;
let areaSelectorRequest = null;
let blogIndexPayload = null;
let blogIndexRequest = null;
const blogArticlePayloadById = new Map();
const blogArticleRequestById = new Map();

async function fetchJson(url) {
  const response = await window.fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload && payload.error ? payload.error : 'Failed to load static content');
  }

  return payload;
}

export async function loadAreaSelectorPayload() {
  if (areaSelectorPayload) {
    return areaSelectorPayload;
  }

  if (areaSelectorRequest) {
    return areaSelectorRequest;
  }

  areaSelectorRequest = fetchJson('/content/area-selector.json')
    .then((payload) => {
      areaSelectorPayload = payload;
      return payload;
    })
    .finally(() => {
      areaSelectorRequest = null;
    });

  return areaSelectorRequest;
}

export async function loadBlogIndexPayload() {
  if (blogIndexPayload) {
    return blogIndexPayload;
  }

  if (blogIndexRequest) {
    return blogIndexRequest;
  }

  blogIndexRequest = fetchJson('/content/blog/index.json')
    .then((payload) => {
      blogIndexPayload = payload;
      return payload;
    })
    .finally(() => {
      blogIndexRequest = null;
    });

  return blogIndexRequest;
}

export async function loadBlogArticlePayload(articleId) {
  if (!articleId) {
    throw new Error('Missing article id');
  }

  if (blogArticlePayloadById.has(articleId)) {
    return blogArticlePayloadById.get(articleId);
  }

  if (blogArticleRequestById.has(articleId)) {
    return blogArticleRequestById.get(articleId);
  }

  const request = fetchJson(`/content/blog/articles/${encodeURIComponent(articleId)}.json`)
    .then((payload) => {
      blogArticlePayloadById.set(articleId, payload);
      return payload;
    })
    .finally(() => {
      blogArticleRequestById.delete(articleId);
    });

  blogArticleRequestById.set(articleId, request);
  return request;
}
