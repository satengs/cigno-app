import { addDays, differenceInCalendarDays, format, isValid, parse, parseISO } from 'date-fns';

const STATUS_VALUES = ['Planning', 'Active', 'In Progress', 'Completed', 'Cancelled', 'On Hold'];
const PRIORITY_VALUES = ['low', 'medium', 'high', 'critical'];
const PROJECT_TYPE_VALUES = ['consulting', 'development', 'design', 'analysis', 'strategy', 'research', 'other'];
const BUDGET_TYPE_VALUES = ['Fixed', 'Hourly', 'Retainer', 'Milestone'];
const CURRENCY_VALUES = ['USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD'];
const DELIVERABLE_TYPE_VALUES = ['Report', 'Dashboard', 'API', 'Presentation', 'Brief', 'Analysis', 'Storyline', 'Documentation', 'Other'];
const DELIVERABLE_STATUS_VALUES = ['Planned', 'In Progress', 'Completed', 'Pending Review'];
const DELIVERABLE_FORMAT_VALUES = ['pdf', 'docx', 'pptx', 'json', 'markdown', 'html', 'other'];

const MONTH_REGEX = /(January|February|March|April|May|June|July|August|September|October|November|December|Jan\.?|Feb\.?|Mar\.?|Apr\.?|Jun\.?|Jul\.?|Aug\.?|Sep\.?|Sept\.?|Oct\.?|Nov\.?|Dec\.?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*\d{2,4})?/gi;
const ISO_DATE_REGEX = /(20\d{2}|19\d{2})[-\/ ]\d{1,2}[-\/ ]\d{1,2}/g;
const NUMERIC_DATE_REGEX = /\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-](?:20\d{2}|19\d{2}))?/g;
const MONEY_REGEX = /(budget|cost|fee|investment|spend|spending|price|priced)[:\-]?\s*(?:is|of|:)?\s*([$€£]|CHF|USD|EUR|GBP|CAD|AUD)?\s*([0-9]+(?:[\.,][0-9]{3})*(?:[\.,][0-9]{2})?)/i;
const CURRENCY_FALLBACK_REGEX = /(USD|EUR|GBP|CHF|CAD|AUD|dollar|euro|pound|franc|swiss franc|canadian dollar|australian dollar)/i;
const BUDGET_TYPE_REGEX = /(fixed|hourly|retainer|milestone)s?/i;
const STATUS_HINT_REGEX = /(completed|complete|finished|done|launched|delivered|in progress|ongoing|active|kick[- ]?off|planning|planned|cancelled|canceled|on hold|paused|suspended)/i;
const PRIORITY_REGEX = /(critical|high priority|medium priority|low priority|urgent|time-sensitive|time sensitive)/i;
const OWNER_REGEX = /(client|stakeholder|contact|owner)[:\-]\s*([A-Z][A-Za-z\-']+(?:\s+[A-Z][A-Za-z\-']+)*)/gi;
const INTERNAL_OWNER_REGEX = /(internal|project|engagement) (?:lead|owner|manager|contact)[:\-]\s*([A-Z][A-Za-z\-']+(?:\s+[A-Z][A-Za-z\-']+)*)/gi;

const DELIVERABLE_VERBS = ['create', 'build', 'develop', 'deliver', 'produce', 'prepare', 'design', 'launch', 'implement', 'generate', 'draft', 'compile'];
const DELIVERABLE_STOP_PHRASES = [' using ', ' with ', ' including ', ' leveraging ', ' featuring ', ' supported by ', ' integrating ', ' built on ', ' utilising ', ' utilizing ', ' powered by ', ' to ', ' for ', ' and ', ' that ', ' which '];

function normalizeWhitespace(value) {
  return value ? value.replace(/\s+/g, ' ').trim() : '';
}

function safeString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
}

function toTitleCase(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function slugify(value, fallback = 'deliverable') {
  const base = normalizeWhitespace(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return base || fallback;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractJsonCandidates(text) {
  if (!text) return [];
  const candidates = [];
  let depth = 0;
  let start = -1;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '{') {
      if (depth === 0) {
        start = i;
      }
      depth += 1;
    } else if (char === '}') {
      if (depth > 0) {
        depth -= 1;
        if (depth === 0 && start !== -1) {
          candidates.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
  }

  return candidates;
}

function parseJsonObjects(text) {
  const results = [];
  const candidates = extractJsonCandidates(text);

  candidates.forEach(candidate => {
    try {
      results.push(JSON.parse(candidate));
    } catch (error) {
      // Ignore malformed JSON fragments
    }
  });

  return results;
}

function sanitizeNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.\-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function sanitizeEnum(value, validValues, fallback) {
  if (!value) return fallback;
  const candidate = safeString(value).trim();
  const match = validValues.find(option => option.toLowerCase() === candidate.toLowerCase());
  return match || fallback;
}

function parseDateCandidate(rawValue, referenceYear) {
  if (!rawValue) return '';
  const candidate = rawValue.replace(/(\d+)(st|nd|rd|th)/gi, '$1').replace(/\s+/g, ' ').trim();

  // ISO date handling first
  if (/\d{4}-\d{2}-\d{2}/.test(candidate)) {
    const parsedIso = parseISO(candidate);
    return isValid(parsedIso) ? format(parsedIso, 'yyyy-MM-dd') : '';
  }

  // Add reference year if missing
  const hasYear = /\d{4}/.test(candidate);
  const defaultYear = referenceYear || new Date().getFullYear();
  const augmented = hasYear ? candidate : `${candidate} ${defaultYear}`;

  const formatsToTry = ['MMMM d yyyy', 'MMM d yyyy', 'MMMM d, yyyy', 'MMM d, yyyy', 'M d yyyy', 'M d, yyyy', 'MM d yyyy', 'MM/dd/yyyy', 'dd/MM/yyyy'];
  for (const dateFormat of formatsToTry) {
    const parsed = parse(augmented, dateFormat, new Date());
    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd');
    }
  }

  return '';
}

function inferProjectStatus(text) {
  if (!text) return 'Planning';
  const match = text.match(STATUS_HINT_REGEX);
  if (!match) return 'Planning';

  const token = match[0].toLowerCase();
  if (token.includes('completed') || token.includes('finished') || token.includes('done') || token.includes('delivered')) {
    return 'Completed';
  }
  if (token.includes('in progress') || token.includes('ongoing') || token.includes('active')) {
    return 'In Progress';
  }
  if (token.includes('cancelled') || token.includes('canceled')) {
    return 'Cancelled';
  }
  if (token.includes('on hold') || token.includes('paused') || token.includes('suspended')) {
    return 'On Hold';
  }
  return 'Planning';
}

function inferPriority(text) {
  if (!text) return 'medium';
  const match = text.match(PRIORITY_REGEX);
  if (!match) return 'medium';
  const token = match[0].toLowerCase();
  if (token.includes('critical') || token.includes('urgent') || token.includes('time-sensitive') || token.includes('time sensitive')) {
    return 'critical';
  }
  if (token.includes('high')) return 'high';
  if (token.includes('low')) return 'low';
  return 'medium';
}

function inferProjectType(text) {
  if (!text) return 'other';
  const lower = text.toLowerCase();
  if (/(ui|ux|design|branding|prototype|visual)/.test(lower)) return 'design';
  if (/(dashboard|build|develop|api|integration|automation|platform|application|app|engineer|engine)/.test(lower)) return 'development';
  if (/(analysis|analytics|research|study|assessment)/.test(lower)) return 'analysis';
  if (/(strategy|roadmap|planning|transformation|advisory)/.test(lower)) return 'strategy';
  if (/(research|investigate|survey|discovery)/.test(lower)) return 'research';
  if (/(consulting|engagement)/.test(lower)) return 'consulting';
  return 'other';
}

function inferBudgetType(text) {
  if (!text) return 'Fixed';
  const match = text.match(BUDGET_TYPE_REGEX);
  if (!match) return 'Fixed';
  const token = match[0].toLowerCase();
  if (token.includes('hourly')) return 'Hourly';
  if (token.includes('retainer')) return 'Retainer';
  if (token.includes('milestone')) return 'Milestone';
  return 'Fixed';
}

function inferCurrencySymbol(text) {
  if (!text) return 'USD';
  if (text.includes('$') || /dollar/i.test(text)) return 'USD';
  if (text.includes('€') || /eur|euro/i.test(text)) return 'EUR';
  if (text.includes('£') || /gbp|pound/i.test(text)) return 'GBP';
  if (/chf|franc/i.test(text)) return 'CHF';
  if (/cad|canadian/i.test(text)) return 'CAD';
  if (/aud|australian/i.test(text)) return 'AUD';
  return 'USD';
}

function extractBudgetDetails(text, mergedCandidates) {
  if (mergedCandidates.budget_amount) {
    return {
      budget_amount: sanitizeNumber(mergedCandidates.budget_amount, mergedCandidates.budget_amount),
      currency: sanitizeEnum(mergedCandidates.currency || mergedCandidates.budget_currency, CURRENCY_VALUES, 'USD'),
      budget_type: sanitizeEnum(mergedCandidates.budget_type, BUDGET_TYPE_VALUES, 'Fixed')
    };
  }

  if (!text) {
    return { budget_amount: 0, currency: 'USD', budget_type: 'Fixed' };
  }

  const match = text.match(MONEY_REGEX);
  if (match) {
    const [, , currencySymbol, numericValue] = match;
    const amount = sanitizeNumber(numericValue, 0);
    const currency = currencySymbol ? inferCurrencySymbol(currencySymbol) : inferCurrencySymbol(text);
    return {
      budget_amount: amount,
      currency,
      budget_type: inferBudgetType(text)
    };
  }

  const currencyFallbackMatch = text.match(CURRENCY_FALLBACK_REGEX);
  const fallbackCurrency = currencyFallbackMatch ? inferCurrencySymbol(currencyFallbackMatch[0]) : 'USD';

  return {
    budget_amount: 0,
    currency: fallbackCurrency,
    budget_type: inferBudgetType(text)
  };
}

function pickBestString(...values) {
  for (const value of values) {
    const candidate = normalizeWhitespace(safeString(value));
    if (candidate) return candidate;
  }
  return '';
}

function extractDates(text, mergedCandidates) {
  const dates = {
    start_date: normalizeWhitespace(safeString(mergedCandidates.start_date || mergedCandidates.startDate)),
    end_date: normalizeWhitespace(safeString(mergedCandidates.end_date || mergedCandidates.endDate))
  };

  const allDateTokens = new Set();

  const isoMatches = text ? text.match(ISO_DATE_REGEX) : null;
  isoMatches?.forEach(token => allDateTokens.add(token));
  const monthMatches = text ? text.match(MONTH_REGEX) : null;
  monthMatches?.forEach(token => allDateTokens.add(token));
  const numericMatches = text ? text.match(NUMERIC_DATE_REGEX) : null;
  numericMatches?.forEach(token => allDateTokens.add(token));

  const dateTokens = Array.from(allDateTokens);
  if (dateTokens.length === 0) {
    return dates;
  }

  let referenceYear;
  for (const token of dateTokens) {
    if (/\d{4}/.test(token)) {
      referenceYear = token.match(/(\d{4})/)[1];
      break;
    }
  }

  if (!dates.start_date) {
    dates.start_date = parseDateCandidate(dateTokens[0], referenceYear);
  }
  if (!dates.end_date && dateTokens.length > 1) {
    dates.end_date = parseDateCandidate(dateTokens[1], referenceYear);
  }

  if (!dates.end_date && dates.start_date) {
    const startDateObj = parseISO(dates.start_date);
    if (isValid(startDateObj)) {
      dates.end_date = format(addDays(startDateObj, 30), 'yyyy-MM-dd');
    }
  }

  if (!dates.start_date && dates.end_date) {
    const endDateObj = parseISO(dates.end_date);
    if (isValid(endDateObj)) {
      dates.start_date = format(addDays(endDateObj, -30), 'yyyy-MM-dd');
    }
  }

  return dates;
}

function sentenceTokenise(text) {
  if (!text) return [];
  return text
    .split(/(?<=[\.!?])\s+|\n|·|\u2022/)
    .map(sentence => normalizeWhitespace(sentence))
    .filter(Boolean);
}

function extractDeliverableTitle(trigger, phrase) {
  const pattern = new RegExp(`^.*?\\b${trigger}\\b`, 'i');
  let working = phrase.replace(pattern, '');
  working = working.trim();
  working = working.replace(/^(an?|the)\s+/i, '');

  for (const stopPhrase of DELIVERABLE_STOP_PHRASES) {
    const normalizedStop = stopPhrase.trim();
    if (!normalizedStop) continue;
    const regex = new RegExp(`\\s${escapeRegExp(normalizedStop)}\\s`, 'i');
    const match = regex.exec(working);
    if (match) {
      working = working.slice(0, match.index);
      break;
    }
  }

  working = working.replace(/[\.,;:]$/, '').trim();
  return toTitleCase(working || 'Key Deliverable');
}

function inferDeliverableType(title, sentence) {
  const source = `${title} ${sentence}`.toLowerCase();
  if (source.includes('dashboard')) return 'Dashboard';
  if (source.includes('api') || source.includes('integration')) return 'API';
  if (source.includes('presentation') || source.includes('deck') || source.includes('slides')) return 'Presentation';
  if (source.includes('storyline')) return 'Storyline';
  if (source.includes('brief')) return 'Brief';
  if (source.includes('analysis') || source.includes('assessment')) return 'Analysis';
  if (source.includes('report') || source.includes('summary')) return 'Report';
  if (source.includes('documentation') || source.includes('specification') || source.includes('playbook') || source.includes('manual')) return 'Documentation';
  if (source.includes('roadmap') || source.includes('plan')) return 'Analysis';
  return 'Other';
}

function inferDeliverableFormat(title, sentence) {
  const source = `${title} ${sentence}`.toLowerCase();
  if (source.includes('ppt')) return 'pptx';
  if (source.includes('deck')) return 'pptx';
  if (source.includes('pdf')) return 'pdf';
  if (source.includes('docx') || source.includes('word')) return 'docx';
  if (source.includes('html') || source.includes('web')) return 'html';
  if (source.includes('markdown')) return 'markdown';
  if (source.includes('json')) return 'json';
  return 'other';
}

function findDueDateInSentence(sentence, referenceYear) {
  if (!sentence) return '';
  const dateMatch = sentence.match(MONTH_REGEX) || sentence.match(ISO_DATE_REGEX) || sentence.match(NUMERIC_DATE_REGEX);
  if (!dateMatch) return '';
  return parseDateCandidate(dateMatch[0], referenceYear);
}

// Detects deliverables from existing structured data and implicit phrasing in the description.
function extractDeliverables(text, mergedCandidates, projectDates) {
  const deliverables = [];
  if (Array.isArray(mergedCandidates.deliverables)) {
    mergedCandidates.deliverables.forEach((deliverable, index) => {
      const title = pickBestString(deliverable.title, deliverable.name, `Deliverable ${index + 1}`);
      const dueDateReferenceYear = projectDates.end_date?.slice(0, 4) || projectDates.start_date?.slice(0, 4);
      const rawDueDate = normalizeWhitespace(safeString(deliverable.due_date || deliverable.dueDate));
      const normalizedDueDate = rawDueDate ? parseDateCandidate(rawDueDate, dueDateReferenceYear) : '';
      deliverables.push({
        id: slugify(deliverable.id || title, `deliverable-${index + 1}`),
        title,
        type: sanitizeEnum(deliverable.type, DELIVERABLE_TYPE_VALUES, inferDeliverableType(title, deliverable.description || '')),
        description: normalizeWhitespace(safeString(deliverable.description || deliverable.brief || title)),
        status: sanitizeEnum(deliverable.status, DELIVERABLE_STATUS_VALUES, 'Planned'),
        due_date: normalizedDueDate,
        quality_score: sanitizeNumber(deliverable.quality_score || deliverable.qualityScore || 0, 0),
        dependencies: Array.isArray(deliverable.dependencies) ? deliverable.dependencies.filter(Boolean) : [],
        metadata: {
          format: sanitizeEnum(deliverable.metadata?.format, DELIVERABLE_FORMAT_VALUES, 'other'),
          assigned_to: normalizeWhitespace(safeString(deliverable.metadata?.assigned_to || deliverable.metadata?.assignedTo)),
          expected_output: normalizeWhitespace(safeString(deliverable.metadata?.expected_output || deliverable.metadata?.expectedOutput || deliverable.description || title))
        }
      });
    });
  }

  const sentences = sentenceTokenise(text);
  const lowerText = text.toLowerCase();
  let referenceYear;
  if (/\d{4}/.test(lowerText)) {
    referenceYear = lowerText.match(/(20\d{2}|19\d{2})/)[1];
  }

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    DELIVERABLE_VERBS.forEach(verb => {
      const index = lowerSentence.indexOf(`${verb} `);
      if (index === -1) return;

      const endIndex = (() => {
        const punctuation = ['.', ';', '!', '?'];
        let boundary = sentence.length;
        for (const mark of punctuation) {
          const markerIndex = sentence.indexOf(mark, index);
          if (markerIndex !== -1) {
            boundary = Math.min(boundary, markerIndex);
          }
        }
        return boundary;
      })();

      let clauseSegment = sentence.slice(index, endIndex);
      outer: for (const otherVerb of DELIVERABLE_VERBS) {
        if (otherVerb === verb) continue;
        const separators = [`, ${otherVerb} `, `; ${otherVerb} `, `. ${otherVerb} `, ` and ${otherVerb} `];
        for (const separator of separators) {
          const lowered = clauseSegment.toLowerCase();
          const markerIndex = lowered.indexOf(separator);
          if (markerIndex !== -1) {
            clauseSegment = clauseSegment.slice(0, markerIndex);
            break outer;
          }
        }
      }

      const rawClause = clauseSegment.replace(/^[,\s]+/, '').trim();
      const title = extractDeliverableTitle(verb, rawClause);
      if (!title) return;
      const slug = slugify(title);
      const existing = deliverables.find(item => item.id === slug || item.title.toLowerCase() === title.toLowerCase());
      const dueDate = findDueDateInSentence(rawClause, referenceYear);
      const clauseDescription = rawClause.charAt(0).toUpperCase() + rawClause.slice(1);

      if (!existing) {
        deliverables.push({
          id: slug,
          title,
          type: inferDeliverableType(title, rawClause),
          description: clauseDescription,
          status: 'Planned',
          due_date: dueDate,
          quality_score: 0,
          dependencies: [],
          metadata: {
            format: inferDeliverableFormat(title, rawClause),
            assigned_to: '',
            expected_output: clauseDescription
          }
        });
      }
    });
  });

  // Attach project-level due dates if missing
  const totalDeliverables = deliverables.length;
  if (totalDeliverables > 0) {
    const startDate = projectDates.start_date && isValid(parseISO(projectDates.start_date)) ? parseISO(projectDates.start_date) : null;
    const endDate = projectDates.end_date && isValid(parseISO(projectDates.end_date)) ? parseISO(projectDates.end_date) : null;

    let interval = 14;
    if (startDate && endDate) {
      const span = Math.max(differenceInCalendarDays(endDate, startDate), 1);
      interval = Math.max(Math.floor(span / (totalDeliverables + 1)), 7);
    }

    deliverables.forEach((deliverable, index) => {
      if (!deliverable.due_date) {
        const baseDate = startDate || new Date();
        const due = addDays(baseDate, interval * (index + 1));
        deliverable.due_date = format(due, 'yyyy-MM-dd');
      }
    });
  }

  // Ensure metadata keys exist and enums are valid, track ID remapping for dependency cleanup
  const idMap = new Map();
  deliverables.forEach((deliverable, index) => {
    const originalId = deliverable.id || slugify(deliverable.title, `deliverable-${index + 1}`);
    const resolvedId = resolveUniqueId(originalId, deliverables, index);
    idMap.set(originalId, resolvedId);
    idMap.set(originalId.toLowerCase(), resolvedId);
    if (deliverable.title) {
      const titleKey = deliverable.title.toLowerCase();
      const slugKey = slugify(deliverable.title);
      idMap.set(titleKey, resolvedId);
      idMap.set(slugKey, resolvedId);
      idMap.set(slugKey.toLowerCase(), resolvedId);
    }
    deliverable.id = resolvedId;
    deliverable.type = sanitizeEnum(deliverable.type, DELIVERABLE_TYPE_VALUES, 'Other');
    deliverable.status = sanitizeEnum(deliverable.status, DELIVERABLE_STATUS_VALUES, 'Planned');
    deliverable.metadata = deliverable.metadata || {};
    deliverable.metadata.format = sanitizeEnum(deliverable.metadata.format, DELIVERABLE_FORMAT_VALUES, 'other');
    deliverable.metadata.assigned_to = normalizeWhitespace(deliverable.metadata.assigned_to) || '';
    deliverable.metadata.expected_output = normalizeWhitespace(deliverable.metadata.expected_output) || deliverable.description;
    deliverable.quality_score = sanitizeNumber(deliverable.quality_score, 0);
    deliverable.dependencies = Array.from(new Set(deliverable.dependencies)).filter(Boolean);
  });

  deliverables.forEach(deliverable => {
    deliverable.dependencies = deliverable.dependencies
      .map(dep => mapDependencyId(dep, idMap))
      .filter(Boolean);
  });

  // Infer dependencies from sentences that mention ordering/dependencies using final IDs
  const dependencySentences = sentences.filter(sentence => /depends on|after completion of|following the/.test(sentence.toLowerCase()));
  dependencySentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const [before, after] = lowerSentence.split(/depends on|after completion of|following the/);
    if (!before || !after) return;

    const source = findDeliverableByFragment(before, deliverables);
    const target = findDeliverableByFragment(after, deliverables);

    if (source && target && !source.dependencies.includes(target.id)) {
      source.dependencies.push(target.id);
    }
  });

  return deliverables;
}

function mapDependencyId(dep, idMap) {
  const raw = normalizeWhitespace(safeString(dep));
  if (!raw) return '';
  const lower = raw.toLowerCase();
  const slug = slugify(raw);
  return idMap.get(raw) || idMap.get(lower) || idMap.get(slug) || idMap.get(slug.toLowerCase()) || '';
}

function findDeliverableByFragment(fragment, deliverables) {
  const cleaned = normalizeWhitespace(fragment).toLowerCase();
  if (!cleaned) return null;

  const directMatch = deliverables.find(item => cleaned.includes(item.id) || cleaned.includes(slugify(item.title)));
  if (directMatch) {
    return directMatch;
  }

  let bestMatch = null;
  let bestScore = 0;

  deliverables.forEach(deliverable => {
    const tokens = deliverable.title.toLowerCase().split(/\s+/).filter(token => token.length > 2);
    if (tokens.length === 0) return;
    let score = 0;
    tokens.forEach(token => {
      if (cleaned.includes(token)) {
        score += Math.min(token.length, 10);
      }
    });
    if (score > bestScore) {
      bestScore = score;
      bestMatch = deliverable;
    }
  });

  return bestScore > 0 ? bestMatch : null;
}

function resolveUniqueId(initialId, deliverables, currentIndex) {
  let candidate = slugify(initialId, `deliverable-${currentIndex + 1}`);
  const seen = new Set();

  deliverables.forEach((item, index) => {
    if (item.id && index !== currentIndex) {
      seen.add(item.id);
    }
  });

  let suffix = 1;
  while (seen.has(candidate)) {
    candidate = `${candidate}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function mergeObjects(base, addition) {
  if (!addition || typeof addition !== 'object') {
    return base;
  }

  return Object.entries(addition).reduce((accumulator, [key, value]) => {
    if (value === null || value === undefined) {
      return accumulator;
    }

    if (Array.isArray(value)) {
      accumulator[key] = Array.isArray(accumulator[key]) ? [...accumulator[key], ...value] : [...value];
      return accumulator;
    }

    if (typeof value === 'object') {
      accumulator[key] = mergeObjects(accumulator[key] || {}, value);
      return accumulator;
    }

    accumulator[key] = value;
    return accumulator;
  }, { ...base });
}

function extractOwners(text, mergedCandidates) {
  const result = {
    client_owner: normalizeWhitespace(safeString(mergedCandidates.client_owner || mergedCandidates.clientOwner)),
    internal_owner: normalizeWhitespace(safeString(mergedCandidates.internal_owner || mergedCandidates.internalOwner))
  };

  if (result.client_owner && result.internal_owner) {
    return result;
  }

  if (text) {
    if (!result.client_owner) {
      const ownerMatch = OWNER_REGEX.exec(text);
      if (ownerMatch) {
        result.client_owner = ownerMatch[2];
      }
      OWNER_REGEX.lastIndex = 0;
    }

    if (!result.internal_owner) {
      const internalMatch = INTERNAL_OWNER_REGEX.exec(text);
      if (internalMatch) {
        result.internal_owner = internalMatch[2];
      }
      INTERNAL_OWNER_REGEX.lastIndex = 0;
    }
  }

  return result;
}

function deriveProjectTags(text, deliverables, mergedCandidates) {
  const tags = new Set();

  (mergedCandidates.tags || []).forEach(tag => {
    const cleaned = normalizeWhitespace(safeString(tag)).toLowerCase();
    if (cleaned) tags.add(cleaned);
  });

  const lower = text.toLowerCase();
  ['ai', 'automation', 'dashboard', 'api', 'strategy', 'presentation', 'report', 'analytics', 'content', 'research'].forEach(keyword => {
    if (lower.includes(keyword)) {
      tags.add(keyword);
    }
  });

  deliverables.forEach(deliverable => {
    const fragments = deliverable.title.toLowerCase().split(' ');
    fragments.forEach(fragment => {
      if (fragment.length > 3) {
        tags.add(fragment);
      }
    });
    if (deliverable.type !== 'Other') {
      tags.add(deliverable.type.toLowerCase());
    }
  });

  return Array.from(tags);
}

function cleanDescription(text) {
  return normalizeWhitespace(text).replace(/\s*Forwarded message:?\s*/i, '');
}

// Main entry point used by API layer to normalise free-form descriptions into schema-compliant JSON.
export function parseProjectDescription(rawText, existing = {}) {
  const text = safeString(rawText);
  const cleanedText = cleanDescription(text);

  const parsedJsonFragments = parseJsonObjects(text);
  const mergedFragments = parsedJsonFragments.reduce((accumulator, fragment) => mergeObjects(accumulator, fragment), {});
  const mergedCandidates = mergeObjects(existing, mergedFragments);

  const skeleton = {
    name: pickBestString(mergedCandidates.name, mergedCandidates.projectName),
    description: pickBestString(mergedCandidates.description, cleanedText),
    start_date: '',
    end_date: '',
    status: 'Planning',
    budget_amount: 0,
    currency: 'USD',
    budget_type: 'Fixed',
    client_owner: '',
    internal_owner: '',
    priority: 'medium',
    project_type: 'other',
    tags: [],
    deliverables: []
  };

  const dates = extractDates(cleanedText, mergedCandidates);
  skeleton.start_date = dates.start_date;
  skeleton.end_date = dates.end_date;

  skeleton.status = sanitizeEnum(pickBestString(mergedCandidates.status, inferProjectStatus(cleanedText)), STATUS_VALUES, 'Planning');
  const budgetDetails = extractBudgetDetails(cleanedText, mergedCandidates);
  skeleton.budget_amount = budgetDetails.budget_amount;
  skeleton.currency = sanitizeEnum(budgetDetails.currency, CURRENCY_VALUES, 'USD');
  skeleton.budget_type = sanitizeEnum(budgetDetails.budget_type, BUDGET_TYPE_VALUES, 'Fixed');

  const owners = extractOwners(cleanedText, mergedCandidates);
  skeleton.client_owner = owners.client_owner;
  skeleton.internal_owner = owners.internal_owner;

  skeleton.priority = sanitizeEnum(pickBestString(mergedCandidates.priority, inferPriority(cleanedText)), PRIORITY_VALUES, 'medium');
  skeleton.project_type = sanitizeEnum(pickBestString(mergedCandidates.project_type, inferProjectType(cleanedText)), PROJECT_TYPE_VALUES, 'other');

  skeleton.deliverables = extractDeliverables(cleanedText, mergedCandidates, dates);
  skeleton.tags = deriveProjectTags(cleanedText, skeleton.deliverables, mergedCandidates);

  // Ensure description contains the core project summary
  skeleton.description = pickBestString(mergedCandidates.description, cleanedText) || 'Project description not provided.';
  skeleton.name = skeleton.name || (skeleton.project_type !== 'other' ? `${toTitleCase(skeleton.project_type)} Project` : 'Project Intake');

  // Provide compatibility aliases expected by the rest of the app
  skeleton.budget_currency = skeleton.currency;

  return skeleton;
}

export default parseProjectDescription;
