/**
 * Utility functions to make API requests.
 * By importing this file, you can use the provided get and post functions.
 * You shouldn't need to modify this file, but if you want to learn more
 * about how these functions work, google search "Fetch API"
 *
 * These functions return promises, which means you should use ".then" on them.
 * e.g. get('/api/foo', { bar: 0 }).then(res => console.log(res))
 */

// ex: formatParams({ some_key: "some_value", a: "b"}) => "some_key=some_value&a=b"
function formatParams(params) {
  return Object.keys(params)
    .map((key) => {
      const value = params[key];
      if (Array.isArray(value)) {
        // Always represent the array explicitly in the query string
        return value
          .map((item) => key + "[]=" + encodeURIComponent(item))
          .join("&");
      }
      return key + "=" + encodeURIComponent(value);
    })
    .join("&");
}

// convert a fetch result to a JSON object with error handling for fetch and json errors
function convertToJSON(res) {
  if (!res.ok) {
    throw `API request failed with response status ${res.status} and text: ${res.statusText}`;
  }

  return res
    .clone() // clone so that the original is still readable for debugging
    .json() // start converting to JSON object
    .catch((error) => {
      // throw an error containing the text that couldn't be converted to JSON
      return res.text().then((text) => {
        throw `API request's result could not be converted to a JSON object: \n${text}`;
      });
    });
}

// Helper code to make a get request. Default parameter of empty JSON Object for params.
// Returns a Promise to a JSON Object.
export async function get(endpoint, params = {}) {
  const fullPath = endpoint + "?" + formatParams(params);

  try {
    const response = await fetch(fullPath);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${fullPath}`);
    }

    const contentType = response.headers.get("Content-Type");

    if (contentType && contentType.startsWith("audio/")) {
      // If it's audio, return the response as a Blob
      const blob = await response.blob();
      return blob;
    } else {
      // Otherwise, parse the response as JSON
      return await response.json();
    }
  } catch (error) {
    throw new Error(`GET request to ${fullPath} failed with error:\n${error}`);
  }
}

// Helper code to make a post request. Default parameter of empty JSON Object for params.
// Returns a Promise to a JSON Object.
export function post(endpoint, params = {}, headers = { "Content-type": "application/json" }) {
  const isFormData = params instanceof FormData;

  return fetch(endpoint, {
    method: "post",
    headers: headers,
    body: isFormData ? params : JSON.stringify(params),
  })
    .then(convertToJSON) // convert result to JSON object
    .catch((error) => {
      // give a useful error message
      throw `POST request to ${endpoint} failed with error:\n${error}`;
    });
}
