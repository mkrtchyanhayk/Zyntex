#!/usr/bin/env node

import axios from 'axios';

const API_URL = 'http://localhost:5000';

console.log('🔍 Testing API Health...\n');

async function testEndpoints() {
    const tests = [
        { name: 'Health Check', method: 'get', url: '/api/health' },
        { name: 'Feed (Public)', method: 'get', url: '/api/posts/feed' },
        {
            name: 'Register',
            method: 'post',
            url: '/api/auth/register',
            data: { username: 'testuser_' + Date.now(), password: 'TestPassword123!' }
        }
    ];

    for (const test of tests) {
        try {
            const result = await axios({
                method: test.method,
                url: `${API_URL}${test.url}`,
                data: test.data,
                timeout: 5000
            });
            console.log(`✅ ${test.name}: SUCCESS (${result.status})`);
        } catch (error) {
            console.log(`❌ ${test.name}: FAILED`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Message: ${error.response.data?.message || 'No message'}`);
            } else if (error.code === 'ECONNREFUSED') {
                console.log(`   Error: Cannot connect to server`);
            } else {
                console.log(`   Error: ${error.message}`);
            }
        }
        console.log('');
    }
}

testEndpoints();
