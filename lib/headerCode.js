const TYPES = ['HTML', 'CSS', 'JavaScript'];
const LOCATIONS = ['HEAD', 'BODY_START', 'BODY_END'];
const FIELDS = ['name', 'type', 'location', 'code', 'description', 'active'];

function cleanText(value) {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

function validateSnippet(input, { partial = false } = {}) {
  const errors = [];
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { value: {}, errors: ['A snippet object is required.'] };
  }

  const value = {};
  for (const field of FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      value[field] = input[field];
    }
  }

  if (!partial) {
    for (const field of ['name', 'type', 'location', 'code']) {
      if (!Object.prototype.hasOwnProperty.call(value, field)) {
        errors.push(`${field} is required.`);
      }
    }
  } else if (Object.keys(value).length === 0) {
    errors.push('At least one snippet field must be provided.');
  }

  if ('name' in value) {
    if (typeof value.name !== 'string') {
      errors.push('Name must be text.');
    } else {
      value.name = cleanText(value.name);
      if (!value.name) errors.push('Name is required.');
      if (value.name.length > 120) errors.push('Name must be 120 characters or fewer.');
    }
  }

  if ('type' in value && !TYPES.includes(value.type)) {
    errors.push(`Type must be one of: ${TYPES.join(', ')}.`);
  }

  if ('location' in value && !LOCATIONS.includes(value.location)) {
    errors.push(`Location must be one of: ${LOCATIONS.join(', ')}.`);
  }

  if ('code' in value) {
    if (typeof value.code !== 'string' || !value.code.trim()) {
      errors.push('Code is required.');
    } else if (value.code.length > 100000) {
      errors.push('Code must be 100,000 characters or fewer.');
    }
  }

  if ('description' in value) {
    if (typeof value.description !== 'string') {
      errors.push('Description must be text.');
    } else {
      value.description = cleanText(value.description);
      if (value.description.length > 1000) {
        errors.push('Description must be 1,000 characters or fewer.');
      }
    }
  }

  if ('active' in value && typeof value.active !== 'boolean') {
    errors.push('Active status must be true or false.');
  }

  if (!partial && !('description' in value)) value.description = '';
  if (!partial && !('active' in value)) value.active = false;

  return { value, errors };
}

module.exports = { TYPES, LOCATIONS, FIELDS, validateSnippet };
