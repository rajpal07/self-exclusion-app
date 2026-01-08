
// Mock logic from SearchForm.tsx
function checkExclusion(records: any[]) {
    if (!records || records.length === 0) return { status: 'ALLOWED', reason: 'No records' };

    const today = new Date();
    // Logic from SearchForm.tsx
    const validRecord = records.find(record => {
        if (!record.expiry_date) return true; // No expiry = permanent/active
        const expiryDate = new Date(record.expiry_date);
        return expiryDate >= today; // Active if expiry is today or future
    });

    if (validRecord) {
        return { status: 'DENIED', record: validRecord };
    } else {
        return { status: 'ALLOWED', reason: 'All records expired' };
    }
}

// Test Cases
const todayStr = new Date().toISOString().split('T')[0];
const futureDate = new Date();
futureDate.setFullYear(futureDate.getFullYear() + 1);
const futureStr = futureDate.toISOString().split('T')[0];

const pastDate = new Date();
pastDate.setFullYear(pastDate.getFullYear() - 1);
const pastStr = pastDate.toISOString().split('T')[0];

const tests = [
    {
        name: 'Single Active Record (Future Expiry)',
        data: [{ id: 1, expiry_date: futureStr }],
        expected: 'DENIED'
    },
    {
        name: 'Single Expired Record (Past Expiry)',
        data: [{ id: 2, expiry_date: pastStr }],
        expected: 'ALLOWED'
    },
    {
        name: 'Multiple Records: One Active, One Expired',
        data: [
            { id: 3, expiry_date: pastStr },
            { id: 4, expiry_date: futureStr }
        ],
        expected: 'DENIED' // Should find the active one
    },
    {
        name: 'Multiple Records: All Expired',
        data: [
            { id: 5, expiry_date: pastStr },
            { id: 6, expiry_date: pastStr }
        ],
        expected: 'ALLOWED'
    },
    {
        name: 'Multiple Records: Permanent Exclusion (No Expiry)',
        data: [
            { id: 7, expiry_date: pastStr },
            { id: 8, expiry_date: null }
        ],
        expected: 'DENIED'
    },
    {
        name: 'No Records',
        data: [],
        expected: 'ALLOWED'
    }
];

console.log('--- RUNNING SAFETY CHECKS ---');
let failed = false;

tests.forEach(test => {
    const result = checkExclusion(test.data);
    const passed = result.status === test.expected;
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${test.name}`);
    if (!passed) {
        console.error(`   Expected: ${test.expected}, Got: ${result.status}`);
        failed = true;
    }
});

if (failed) {
    console.error('\nXXX SAFETY CHECKS FAILED XXX');
    process.exit(1);
} else {
    console.log('\n>>> ALL SAFETY CHECKS PASSED <<<');
}
