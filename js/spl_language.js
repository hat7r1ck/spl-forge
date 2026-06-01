/*
 * SPL Forge, SPL tokenizer for the Monaco editor (Monarch grammar).
 *
 * Original work, hand-written for SPL Forge. Recognises Splunk SPL pipe
 * commands, eval/stats/convert function calls, logical and structural
 * keywords, backtick macros and block comments, quoted strings, numbers,
 * and operators.
 *
 * The command and function name lists below are factual SPL identifiers
 * (the names of the language's built-in commands and functions); the
 * tokenizer state machine is original to this project.
 *
 * Exposes { lang }, an IMonarchLanguage for:
 *   monaco.languages.setMonarchTokensProvider('spl', lang)
 *
 * Token roles emitted (styled by the app's Monaco themes):
 *   command  pipe  argument  function  keyword  operator
 *   string   number  delimiter  macro.comment  macro.function  macro.args
 * Field names, values, and anything unrecognised fall back to the default
 * token, so the editor stays quiet instead of flagging everything red.
 */
(function (global, factory) {
    if (typeof define === 'function' && define.amd)
        define(function () { return factory(); });
    else if (typeof module === 'object' && module.exports)
        module.exports = factory();
    else
        global.spl_language = factory();
}(typeof window !== 'undefined' ? window : this, function () {

    // Splunk SPL pipe command names. Factual identifiers, kept in sync with
    // the command reference in data/spl.json.
    var COMMANDS = [
        'abstract', 'accum', 'addcoltotals', 'addinfo', 'addtotals',
        'analyzefields', 'anomalies', 'anomalousvalue', 'anomalydetection',
        'append', 'appendcols', 'appendpipe', 'archivebuckets', 'arules',
        'associate', 'audit', 'autoregress', 'bin', 'bucket', 'bucketdir', 'chart',
        'cluster', 'cofilter', 'collect', 'concurrency', 'contingency',
        'convert', 'correlate', 'datamodel', 'dbinspect', 'dedup', 'delete',
        'delta', 'diff', 'erex', 'eval', 'eventcount', 'eventstats', 'extract',
        'fieldformat', 'fields', 'fieldsummary', 'file', 'filldown', 'fillnull',
        'findtypes', 'foreach', 'format', 'from', 'gauge', 'gentimes', 'geom',
        'geomfilter', 'geostats', 'head', 'highlight', 'history', 'iconify',
        'input', 'inputcsv', 'inputlookup', 'iplocation', 'join', 'kmeans',
        'kvform', 'loadjob', 'localize', 'localop', 'lookup', 'makecontinuous',
        'makejson', 'makemv', 'makeresults', 'map', 'mcatalog', 'mcollect', 'metadata',
        'metasearch', 'meventcollect', 'mpreview', 'mstats', 'multikv', 'multisearch',
        'mvcombine', 'mvexpand', 'nomv', 'outlier', 'outputcsv', 'outputlookup',
        'outputtelemetry', 'outputtext', 'overlap', 'pivot', 'predict',
        'rangemap', 'rare', 'redistribute', 'regex', 'relevancy', 'reltime',
        'rename', 'replace', 'require', 'rest', 'return', 'reverse', 'rex', 'rtorder',
        'savedsearch', 'script', 'scrub', 'search', 'searchtxn', 'selfjoin',
        'sendalert', 'sendemail', 'set', 'shape', 'sichart', 'sirare', 'sistats',
        'sitimechart', 'sitop', 'sort', 'spath', 'stats', 'strcat',
        'streamstats', 'table', 'tags', 'tail', 'timechart', 'timewrap', 'tojson', 'top',
        'transaction', 'transpose', 'trendline', 'tscollect', 'tstats', 'typeahead', 'typer',
        'union', 'uniq', 'untable', 'walklex', 'where', 'x11', 'xmlkv', 'xmlunescape',
        'xpath', 'xyseries'
    ];

    // eval, stats-aggregation, and convert function names. Factual SPL
    // identifiers. Percentile forms (perc95, p99, ...) are matched by regex
    // below rather than enumerated.
    var FUNCTIONS = [
        // eval / general
        'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh',
        'case', 'ceiling', 'ceil', 'cidrmatch', 'coalesce', 'commands', 'cos',
        'cosh', 'exact', 'exp', 'false', 'floor', 'hypot', 'if', 'ifnull',
        'isbool', 'isint', 'isnotnull', 'isnull', 'isnum', 'isstr', 'json_object',
        'json_array', 'json_extract', 'json_valid', 'len', 'like', 'ln', 'log',
        'lower', 'ltrim', 'match', 'max', 'md5', 'min', 'mvappend', 'mvcount',
        'mvdedup', 'mvfilter', 'mvfind', 'mvindex', 'mvjoin', 'mvmap', 'mvrange',
        'mvsort', 'mvzip', 'now', 'null', 'nullif', 'pi', 'pow', 'printf',
        'random', 'relative_time', 'replace', 'round', 'rtrim', 'searchmatch',
        'sha1', 'sha256', 'sha512', 'sigfig', 'sin', 'sinh', 'spath', 'split',
        'sqrt', 'strftime', 'strptime', 'substr', 'tan', 'tanh', 'time',
        'tonumber', 'tostring', 'trim', 'true', 'typeof', 'upper', 'urldecode',
        'validate',
        // stats aggregations
        'avg', 'c', 'count', 'dc', 'distinct_count', 'earliest', 'earliest_time',
        'estdc', 'estdc_error', 'exactperc', 'first', 'last', 'latest',
        'latest_time', 'list', 'mean', 'median', 'mode', 'p', 'perc', 'range',
        'rate', 'rate_avg', 'rate_sum', 'sparkline', 'stdev', 'stdevp', 'sum',
        'sumsq', 'upperperc', 'values', 'var', 'varp',
        // convert
        'auto', 'ctime', 'dur2sec', 'memk', 'mktime', 'mstime', 'none', 'num',
        'rmcomma', 'rmunit'
    ];

    // Logical and structural keywords that appear inside command bodies.
    var KEYWORDS = [
        'as', 'by', 'where', 'over', 'with', 'output', 'outputnew', 'sortby',
        'in', 'and', 'or', 'not', 'xor', 'like', 'between', 'is', 'asc', 'desc',
        'groupby', 'union', 'diff', 'intersect', 'term', 'case'
    ];

    return {
        lang: {
            defaultToken: '',
            ignoreCase: true,
            commands: COMMANDS,
            functions: FUNCTIONS,
            keywords: KEYWORDS,

            // Percentile aggregation forms: perc95, p99, exactperc50, upperperc90.
            percentile: /(?:exactperc|upperperc|perc|p)\d{1,3}/,

            tokenizer: {
                root: [
                    { include: '@whitespace' },
                    { include: '@macros' },
                    { include: '@strings' },
                    { include: '@numbers' },

                    // A pipe starts a new command; the next word is the command name.
                    [/\|/, { token: 'pipe', next: '@command' }],

                    // Subsearch opener: the first word inside is also a command.
                    [/\[/, { token: 'delimiter', next: '@command' }],
                    [/\]/, 'delimiter'],
                    [/[()]/, 'delimiter'],
                    [/,/, 'delimiter'],

                    // Named argument or field filter: word immediately before a
                    // single '=' (not '==', which is the equality operator).
                    [/[a-zA-Z_][\w.]*(?=\s*=[^=])/, 'argument'],

                    // Any function call: a word immediately before '('.
                    [/[a-zA-Z_][\w]*(?=\s*\()/, 'function'],

                    // Percentile aggregation, bare or called: perc95, p99, ...
                    [/@percentile/, 'function'],

                    // Bareword: keyword, known function name (e.g. bare `count`
                    // in `stats count by host`), or a plain field/identifier.
                    [/[a-zA-Z_][\w.]*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@functions': 'function',
                            '@default': ''
                        }
                    }],

                    // Comparison and arithmetic operators.
                    [/!=|<=|>=|==|[=<>]/, 'operator'],
                    [/[-+*/%]/, 'operator']
                ],

                // Entered right after a '|' or '['. Consume optional whitespace,
                // then tag the first word as the command and return.
                command: [
                    [/[ \t\r\n]+/, 'white'],
                    { include: '@macros' },
                    [/[a-zA-Z_]\w*/, { token: 'command', next: '@pop' }],
                    // Not a command word (e.g. a leading '|' inside '[ | ... ]'):
                    // pop without consuming so root handles it.
                    ['', '', '@pop']
                ],

                whitespace: [
                    [/[ \t\r\n]+/, 'white']
                ],

                // Backtick macros and triple-backtick block comments.
                macros: [
                    [/```/, { token: 'macro.comment', next: '@blockComment' }],
                    // `comment("...")` style wrapped comment macro.
                    [/`\s*comment\s*\(/, { token: 'macro.comment', next: '@commentMacro' }],
                    // `macro_name(args)` or bare `macro_name`.
                    [/(`)(\s*[\w:]+)([^`]*)(`)/,
                        ['macro.function', 'macro.function', 'macro.args', 'macro.function']]
                ],
                blockComment: [
                    [/```/, { token: 'macro.comment', next: '@pop' }],
                    [/[^`]+/, 'macro.comment'],
                    [/`/, 'macro.comment']
                ],
                commentMacro: [
                    [/\)\s*`/, { token: 'macro.comment', next: '@pop' }],
                    [/\\./, 'macro.comment'],
                    [/[^\\)]+/, 'macro.comment'],
                    [/\)/, 'macro.comment']
                ],

                numbers: [
                    [/0[xX][0-9a-fA-F]+/, 'number'],
                    [/(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?/, 'number']
                ],

                // Double- and single-quoted strings, with backslash escapes.
                strings: [
                    [/"/, { token: 'string.escape', next: '@stringDouble' }],
                    [/'/, { token: 'string.escape', next: '@stringSingle' }]
                ],
                stringDouble: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string'],
                    [/"/, { token: 'string.escape', next: '@pop' }]
                ],
                stringSingle: [
                    [/[^\\']+/, 'string'],
                    [/\\./, 'string'],
                    [/'/, { token: 'string.escape', next: '@pop' }]
                ]
            }
        }
    };
}));
