/**
 * Pure Node.js IME logic test — no framework needed.
 * Simulates the exact event sequence that happens in Chrome when typing Chinese:
 *
 * compositionstart → input(拼音) × N → compositionend → input(汉字)
 *
 * Tests the logic extracted from search-ui.tsx bindIME handler.
 */

let passed = 0;
let failed = 0;

function assert(condition, msg) {
    if (condition) {
        console.log(`  ✓ ${msg}`);
        passed++;
    } else {
        console.error(`  ✗ ${msg}`);
        failed++;
    }
}

// ─── Simulate the bindIME logic ───────────────────────────────────────────────

function createIMEHandler(onChangeText) {
    let isComposing = false;
    const calls = [];
    const wrappedOnChange = (v) => { calls.push(v); onChangeText?.(v); };

    const handlers = {
        compositionstart: () => { isComposing = true; },
        compositionend: (value) => {
            isComposing = false;
            wrappedOnChange(value);
        },
        // Returns true if the input event should be blocked (stopImmediatePropagation)
        input: (value) => {
            if (isComposing) return true; // blocked
            wrappedOnChange(value);
            return false; // not blocked
        },
    };

    return { handlers, calls, getIsComposing: () => isComposing };
}

// ─── Test 1: English input — no IME, every keystroke updates ─────────────────
console.log('\nTest 1: English input (no IME)');
{
    const results = [];
    const { handlers } = createIMEHandler(v => results.push(v));

    // Type "hello" — no composition events
    for (const char of ['h', 'he', 'hel', 'hell', 'hello']) {
        const blocked = handlers.input(char);
        assert(!blocked, `input("${char}") not blocked`);
    }
    assert(results.join(',') === 'h,he,hel,hell,hello', `results = ${results.join(',')}`);
}

// ─── Test 2: Chinese IME — pinyin blocked, final hanzi written ────────────────
console.log('\nTest 2: Chinese IME (ni hao → 你好)');
{
    const results = [];
    const { handlers, getIsComposing } = createIMEHandler(v => results.push(v));

    // User starts IME
    handlers.compositionstart();
    assert(getIsComposing(), 'isComposing = true after compositionstart');

    // Pinyin keystrokes — all should be blocked
    for (const pinyin of ['n', 'ni', 'nih', 'niha', 'nihao']) {
        const blocked = handlers.input(pinyin);
        assert(blocked, `input("${pinyin}") blocked during composition`);
    }
    assert(results.length === 0, 'no onChangeText calls during composition');

    // User selects 你好
    handlers.compositionend('你好');
    assert(!getIsComposing(), 'isComposing = false after compositionend');
    assert(results.length === 1, 'onChangeText called once after compositionend');
    assert(results[0] === '你好', `final value = "${results[0]}"`);
}

// ─── Test 3: Mixed input — English then Chinese ───────────────────────────────
console.log('\nTest 3: Mixed input (hello + 你好)');
{
    const results = [];
    const { handlers } = createIMEHandler(v => results.push(v));

    // English first
    handlers.input('h');
    handlers.input('he');

    // Chinese IME
    handlers.compositionstart();
    handlers.input('n');   // blocked
    handlers.input('ni');  // blocked
    handlers.compositionend('你');

    // More English
    handlers.input('你a');
    handlers.input('你ab');

    assert(results[0] === 'h', `step1 = "${results[0]}"`);
    assert(results[1] === 'he', `step2 = "${results[1]}"`);
    assert(results[2] === '你', `after IME = "${results[2]}"`);
    assert(results[3] === '你a', `after IME+a = "${results[3]}"`);
    assert(results[4] === '你ab', `after IME+ab = "${results[4]}"`);
    assert(results.length === 5, `total calls = ${results.length}`);
}

// ─── Test 4: Enter key during composition should not trigger search ───────────
console.log('\nTest 4: Enter key guard during IME');
{
    let isComposing = false;
    let searchFired = false;

    const handleKeyDown = (key) => {
        if (key === 'Enter' && !isComposing) {
            searchFired = true;
        }
    };

    // Enter during composition — should NOT fire
    isComposing = true;
    handleKeyDown('Enter');
    assert(!searchFired, 'Enter during composition does not fire search');

    // Enter after composition — should fire
    isComposing = false;
    handleKeyDown('Enter');
    assert(searchFired, 'Enter after composition fires search');
}

// ─── Test 5: Backspace during English input ───────────────────────────────────
console.log('\nTest 5: Backspace (no manual handling needed)');
{
    const results = [];
    const { handlers } = createIMEHandler(v => results.push(v));

    handlers.input('hello');
    handlers.input('hell');  // browser handles backspace, fires input with new value
    assert(results[0] === 'hello', `before backspace = "${results[0]}"`);
    assert(results[1] === 'hell', `after backspace = "${results[1]}"`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
    process.exit(1);
} else {
    console.log('All tests passed ✓');
}
