const db = require('./database');

const problems = [
  // EASY (1-20)
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume each input has exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    starter_code: {
      python: 'class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your solution here\n        pass\n',
      javascript: 'function twoSum(nums, target) {\n  // Write your solution here\n}\n',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write code here\n        return new int[]{};\n    }\n}\n',
      cpp: '#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};\n'
    },
    hints: ['Can you use a hash map to look up the complement in O(1) time?', 'Compute complement = target - nums[i]. Check if complement is in the map.'],
    solution: 'Use a hash map to store value -> index. For each number x, check if (target - x) exists in the map in O(1) time. Overall time complexity O(N), space complexity O(N).',
    test_cases: [
      { input: '[2,7,11,15]\n9', expected_output: '[0, 1]', is_hidden: 0 },
      { input: '[3,2,4]\n6', expected_output: '[1, 2]', is_hidden: 0 },
      { input: '[3,3]\n6', expected_output: '[0, 1]', is_hidden: 1 },
      { input: '[1,5,9,12]\n14', expected_output: '[1, 2]', is_hidden: 1 }
    ]
  },
  {
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    difficulty: 'Easy',
    topic: 'Strings',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
      { input: 's = "race a car"', output: 'false' }
    ],
    constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters.'],
    starter_code: {
      python: 'class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        pass\n',
      javascript: 'function isPalindrome(s) {\n  // Return boolean\n}\n',
      java: 'class Solution {\n    public boolean isPalindrome(String s) {\n        return false;\n    }\n}\n'
    },
    hints: ['Filter characters with isalnum() or regex, convert to lowercase, then compare with reversed.'],
    solution: 'Use two pointers from left and right skipping non-alphanumeric characters. Time O(N), Space O(1).',
    test_cases: [
      { input: 'A man, a plan, a canal: Panama', expected_output: 'true', is_hidden: 0 },
      { input: 'race a car', expected_output: 'false', is_hidden: 0 },
      { input: ' ', expected_output: 'true', is_hidden: 1 },
      { input: '0P', expected_output: 'false', is_hidden: 1 }
    ]
  },
  {
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.',
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.' },
      { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'In this case, no transactions are done and max profit = 0.' }
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    starter_code: {
      python: 'class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        pass\n',
      javascript: 'function maxProfit(prices) {\n  // Return max profit\n}\n'
    },
    hints: ['Keep track of the minimum price seen so far and the maximum profit obtained.'],
    solution: 'Iterate through prices tracking min_price. On each step, profit = price - min_price. Track max profit. Time O(N), Space O(1).',
    test_cases: [
      { input: '[7,1,5,3,6,4]', expected_output: '5', is_hidden: 0 },
      { input: '[7,6,4,3,1]', expected_output: '0', is_hidden: 0 },
      { input: '[2,4,1]', expected_output: '2', is_hidden: 1 }
    ]
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    topic: 'Stacks & Queues',
    description: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' }
    ],
    constraints: ['1 <= s.length <= 10^4'],
    starter_code: {
      python: 'class Solution:\n    def isValid(self, s: str) -> bool:\n        pass\n',
      javascript: 'function isValid(s) {\n  // Return boolean\n}\n'
    },
    hints: ['Push opening brackets to stack. When finding a closing bracket, pop and ensure it matches.'],
    solution: 'Stack data structure matching open and close pairs. Time O(N), Space O(N).',
    test_cases: [
      { input: '()', expected_output: 'true', is_hidden: 0 },
      { input: '()[]{}', expected_output: 'true', is_hidden: 0 },
      { input: '(]', expected_output: 'false', is_hidden: 1 },
      { input: '([)]', expected_output: 'false', is_hidden: 1 }
    ]
  },
  {
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    topic: 'Searching',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, return its index. Otherwise, return -1.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' }
    ],
    constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4'],
    starter_code: {
      python: 'class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        pass\n',
      javascript: 'function search(nums, target) {\n  // Return index or -1\n}\n'
    },
    hints: ['Use low and high pointers, calculate mid = (low + high) // 2.'],
    solution: 'Classic binary search dividing search space in half. Time O(log N), Space O(1).',
    test_cases: [
      { input: '[-1,0,3,5,9,12]\n9', expected_output: '4', is_hidden: 0 },
      { input: '[-1,0,3,5,9,12]\n2', expected_output: '-1', is_hidden: 0 }
    ]
  },
  {
    title: 'Maximum Subarray (Kadane)',
    slug: 'maximum-subarray',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' }
    ],
    constraints: ['1 <= nums.length <= 10^5'],
    starter_code: {
      python: 'class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        pass\n',
      javascript: 'function maxSubArray(nums) {\n  // Return sum\n}\n'
    },
    hints: ['Kadane algorithm: current_sum = max(num, current_sum + num).'],
    solution: 'Kadane algorithm tracks max running sum. Time O(N), Space O(1).',
    test_cases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expected_output: '6', is_hidden: 0 },
      { input: '[1]', expected_output: '1', is_hidden: 0 },
      { input: '[5,4,-1,7,8]', expected_output: '23', is_hidden: 1 }
    ]
  },
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    topic: 'Dynamic Programming',
    description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    examples: [
      { input: 'n = 2', output: '2', explanation: '1+1 or 2' },
      { input: 'n = 3', output: '3', explanation: '1+1+1, 1+2, or 2+1' }
    ],
    constraints: ['1 <= n <= 45'],
    starter_code: {
      python: 'class Solution:\n    def climbStairs(self, n: int) -> int:\n        pass\n',
      javascript: 'function climbStairs(n) {\n  // Return count\n}\n'
    },
    hints: ['This is the Fibonacci sequence! ways(n) = ways(n-1) + ways(n-2).'],
    solution: 'Fibonacci recurrence with two variables. Time O(N), Space O(1).',
    test_cases: [
      { input: '2', expected_output: '2', is_hidden: 0 },
      { input: '3', expected_output: '3', is_hidden: 0 },
      { input: '5', expected_output: '8', is_hidden: 1 }
    ]
  },
  {
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
    examples: [
      { input: 'nums = [1,2,3,1]', output: 'true' },
      { input: 'nums = [1,2,3,4]', output: 'false' }
    ],
    constraints: ['1 <= nums.length <= 10^5'],
    starter_code: {
      python: 'class Solution:\n    def containsDuplicate(self, nums: list[int]) -> bool:\n        pass\n',
      javascript: 'function containsDuplicate(nums) {\n  // Return boolean\n}\n'
    },
    hints: ['Check if len(set(nums)) < len(nums).'],
    solution: 'Hash set lookup. Time O(N), Space O(N).',
    test_cases: [
      { input: '[1,2,3,1]', expected_output: 'true', is_hidden: 0 },
      { input: '[1,2,3,4]', expected_output: 'false', is_hidden: 0 }
    ]
  },
  {
    title: 'Single Number',
    slug: 'single-number',
    difficulty: 'Easy',
    topic: 'Bit Manipulation',
    description: 'Given a non-empty array of integers nums, every element appears twice except for one. Find that single one. Implement a solution with a linear runtime complexity and use only constant extra space.',
    examples: [
      { input: 'nums = [2,2,1]', output: '1' },
      { input: 'nums = [4,1,2,1,2]', output: '4' }
    ],
    constraints: ['1 <= nums.length <= 3 * 10^4'],
    starter_code: {
      python: 'class Solution:\n    def singleNumber(self, nums: list[int]) -> int:\n        pass\n',
      javascript: 'function singleNumber(nums) {\n  // XOR all elements\n}\n'
    },
    hints: ['XOR of two identical numbers is 0. XOR with 0 is the number itself.'],
    solution: 'XOR accumulation. a ^ a = 0, a ^ 0 = a. Time O(N), Space O(1).',
    test_cases: [
      { input: '[2,2,1]', expected_output: '1', is_hidden: 0 },
      { input: '[4,1,2,1,2]', expected_output: '4', is_hidden: 0 }
    ]
  },
  {
    title: 'Find the Missing Number',
    slug: 'missing-number',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    description: 'Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array.',
    examples: [
      { input: 'nums = [3,0,1]', output: '2' },
      { input: 'nums = [0,1]', output: '2' }
    ],
    constraints: ['n == nums.length', '1 <= n <= 10^4'],
    starter_code: {
      python: 'class Solution:\n    def missingNumber(self, nums: list[int]) -> int:\n        pass\n',
      javascript: 'function missingNumber(nums) {\n  // Formula or XOR\n}\n'
    },
    hints: ['The sum of 0 to n is n*(n+1)//2. Subtract the sum of elements.'],
    solution: 'Gauss summation formula n*(n+1)/2 - sum(nums). Time O(N), Space O(1).',
    test_cases: [
      { input: '[3,0,1]', expected_output: '2', is_hidden: 0 },
      { input: '[9,6,4,2,3,5,7,0,1]', expected_output: '8', is_hidden: 1 }
    ]
  },
  {
    title: 'Reverse String',
    slug: 'reverse-string',
    difficulty: 'Easy',
    topic: 'Two Pointers',
    description: 'Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.',
    examples: [{ input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' }],
    constraints: ['1 <= s.length <= 10^5'],
    starter_code: {
      python: 'class Solution:\n    def reverseString(self, s: list[str]) -> None:\n        pass\n',
      javascript: 'function reverseString(s) {\n  // in-place reverse\n}\n'
    },
    hints: ['Two pointers left=0, right=len-1 swapping inward.'],
    solution: 'Two pointers swap. Time O(N), Space O(1).',
    test_cases: [
      { input: '["h","e","l","l","o"]', expected_output: '["o","l","l","e","h"]', is_hidden: 0 },
      { input: '["H","a","n","n","a","h"]', expected_output: '["h","a","n","n","a","H"]', is_hidden: 1 }
    ]
  },
  {
    title: 'Merge Sorted Array',
    slug: 'merge-sorted-array',
    difficulty: 'Easy',
    topic: 'Two Pointers',
    description: 'You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, representing the number of elements in nums1 and nums2 respectively. Merge nums1 and nums2 into a single array sorted in non-decreasing order.',
    examples: [{ input: 'nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3', output: '[1,2,2,3,5,6]' }],
    constraints: ['nums1.length == m + n', '0 <= m, n <= 200'],
    starter_code: {
      python: 'class Solution:\n    def merge(self, nums1: list[int], m: int, nums2: list[int], n: int) -> None:\n        pass\n',
      javascript: 'function merge(nums1, m, nums2, n) {\n  // Merge from the back\n}\n'
    },
    hints: ['Fill nums1 from the back (index m + n - 1) to avoid overwriting elements.'],
    solution: 'Three pointers from back. Time O(m+n), Space O(1).',
    test_cases: [
      { input: '[1,2,3,0,0,0]\n3\n[2,5,6]\n3', expected_output: '[1, 2, 2, 3, 5, 6]', is_hidden: 0 },
      { input: '[1]\n1\n[]\n0', expected_output: '[1]', is_hidden: 1 }
    ]
  },
  {
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    difficulty: 'Easy',
    topic: 'Math',
    description: 'Given an integer x, return true if x is a palindrome, and false otherwise.',
    examples: [
      { input: 'x = 121', output: 'true' },
      { input: 'x = -121', output: 'false' },
      { input: 'x = 10', output: 'false' }
    ],
    constraints: ['-2^31 <= x <= 2^31 - 1'],
    starter_code: {
      python: 'class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        pass\n',
      javascript: 'function isPalindrome(x) {\n  // Return boolean\n}\n'
    },
    hints: ['Negative numbers can never be palindromes due to minus sign.'],
    solution: 'Reverse half the number or string compare. Time O(log10(x)), Space O(1).',
    test_cases: [
      { input: '121', expected_output: 'true', is_hidden: 0 },
      { input: '-121', expected_output: 'false', is_hidden: 0 },
      { input: '10', expected_output: 'false', is_hidden: 1 }
    ]
  },
  {
    title: 'Roman to Integer',
    slug: 'roman-to-integer',
    difficulty: 'Easy',
    topic: 'Strings',
    description: 'Given a roman numeral string s, convert it to an integer.',
    examples: [
      { input: 's = "III"', output: '3' },
      { input: 's = "LVIII"', output: '58' },
      { input: 's = "MCMXCIV"', output: '1994' }
    ],
    constraints: ['1 <= s.length <= 15', 's contains only characters ("I", "V", "X", "L", "C", "D", "M")'],
    starter_code: {
      python: 'class Solution:\n    def romanToInt(self, s: str) -> int:\n        pass\n',
      javascript: 'function romanToInt(s) {\n  // Map Roman values\n}\n'
    },
    hints: ['If a smaller numeral appears before a larger one, subtract it (e.g. IV = 5 - 1).'],
    solution: 'Map Roman letters to values. Subtract if next is larger, else add. Time O(N), Space O(1).',
    test_cases: [
      { input: 'III', expected_output: '3', is_hidden: 0 },
      { input: 'LVIII', expected_output: '58', is_hidden: 0 },
      { input: 'MCMXCIV', expected_output: '1994', is_hidden: 1 }
    ]
  },
  {
    title: 'Longest Common Prefix',
    slug: 'longest-common-prefix',
    difficulty: 'Easy',
    topic: 'Strings',
    description: 'Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string "".',
    examples: [
      { input: 'strs = ["flower","flow","flight"]', output: '"fl"' },
      { input: 'strs = ["dog","racecar","car"]', output: '""' }
    ],
    constraints: ['1 <= strs.length <= 200', '0 <= strs[i].length <= 200'],
    starter_code: {
      python: 'class Solution:\n    def longestCommonPrefix(self, strs: list[str]) -> str:\n        pass\n',
      javascript: 'function longestCommonPrefix(strs) {\n  // Return prefix\n}\n'
    },
    hints: ['Vertical scanning: compare characters column by column across all strings.'],
    solution: 'Vertical scan or sort and compare first and last strings. Time O(S), Space O(1).',
    test_cases: [
      { input: '["flower","flow","flight"]', expected_output: 'fl', is_hidden: 0 },
      { input: '["dog","racecar","car"]', expected_output: '', is_hidden: 0 }
    ]
  },
  {
    title: 'SQL: Select High Achievers',
    slug: 'sql-high-achievers',
    difficulty: 'Easy',
    topic: 'DBMS & SQL',
    description: 'Write an SQL query to report the name and email of all students whose score in performance is greater than or equal to 85.',
    examples: [{ input: 'performance table', output: 'Students with score >= 85' }],
    constraints: ['Standard SQL query returning name, email'],
    starter_code: {
      sql: 'SELECT u.name, u.email\nFROM users u\nJOIN performance p ON u.id = p.student_id\nWHERE p.score >= 85;\n'
    },
    hints: ['Join users on student_id and filter in WHERE clause.'],
    solution: 'SELECT DISTINCT u.name, u.email FROM users u JOIN performance p ON u.id = p.student_id WHERE p.score >= 85;',
    test_cases: [
      { input: 'test', expected_output: 'Alex Chen', is_hidden: 0 }
    ]
  },
  {
    title: 'Majority Element',
    slug: 'majority-element',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    description: 'Given an array nums of size n, return the majority element. The majority element is the element that appears more than ⌊n / 2⌋ times.',
    examples: [{ input: 'nums = [3,2,3]', output: '3' }, { input: 'nums = [2,2,1,1,1,2,2]', output: '2' }],
    constraints: ['n == nums.length', '1 <= n <= 5 * 10^4'],
    starter_code: {
      python: 'class Solution:\n    def majorityElement(self, nums: list[int]) -> int:\n        pass\n',
      javascript: 'function majorityElement(nums) {\n  // Boyer-Moore voting\n}\n'
    },
    hints: ['Boyer-Moore Voting Algorithm maintains a candidate and a count.'],
    solution: 'Boyer-Moore voting. Time O(N), Space O(1).',
    test_cases: [
      { input: '[3,2,3]', expected_output: '3', is_hidden: 0 },
      { input: '[2,2,1,1,1,2,2]', expected_output: '2', is_hidden: 1 }
    ]
  },
  {
    title: 'Move Zeroes',
    slug: 'move-zeroes',
    difficulty: 'Easy',
    topic: 'Two Pointers',
    description: 'Given an integer array nums, move all 0s to the end of it while maintaining the relative order of the non-zero elements. You must do this in-place without making a copy of the array.',
    examples: [{ input: 'nums = [0,1,0,3,12]', output: '[1,3,12,0,0]' }],
    constraints: ['1 <= nums.length <= 10^4'],
    starter_code: {
      python: 'class Solution:\n    def moveZeroes(self, nums: list[int]) -> None:\n        pass\n',
      javascript: 'function moveZeroes(nums) {\n  // In-place pointer\n}\n'
    },
    hints: ['Maintain lastNonZeroFoundAt pointer and swap non-zero elements forward.'],
    solution: 'Two pointers swap non-zero forward. Time O(N), Space O(1).',
    test_cases: [
      { input: '[0,1,0,3,12]', expected_output: '[1, 3, 12, 0, 0]', is_hidden: 0 },
      { input: '[0]', expected_output: '[0]', is_hidden: 1 }
    ]
  },
  {
    title: 'Intersection of Two Arrays',
    slug: 'intersection-of-two-arrays',
    difficulty: 'Easy',
    topic: 'Arrays & Hashing',
    description: 'Given two integer arrays nums1 and nums2, return an array of their intersection. Each element in the result must be unique and you may return the result in any order.',
    examples: [{ input: 'nums1 = [1,2,2,1], nums2 = [2,2]', output: '[2]' }],
    constraints: ['1 <= nums1.length, nums2.length <= 1000'],
    starter_code: {
      python: 'class Solution:\n    def intersection(self, nums1: list[int], nums2: list[int]) -> list[int]:\n        pass\n',
      javascript: 'function intersection(nums1, nums2) {\n  // Set intersection\n}\n'
    },
    hints: ['Convert one array to a set, check presence of each element of the second.'],
    solution: 'Hash set intersection. Time O(N+M), Space O(N).',
    test_cases: [
      { input: '[1,2,2,1]\n[2,2]', expected_output: '[2]', is_hidden: 0 },
      { input: '[4,9,5]\n[9,4,9,8,4]', expected_output: '[9, 4]', is_hidden: 1 }
    ]
  },
  {
    title: 'Power of Two',
    slug: 'power-of-two',
    difficulty: 'Easy',
    topic: 'Bit Manipulation',
    description: 'Given an integer n, return true if it is a power of two. Otherwise, return false. An integer n is a power of two if there exists an integer x such that n == 2^x.',
    examples: [{ input: 'n = 1', output: 'true' }, { input: 'n = 16', output: 'true' }, { input: 'n = 3', output: 'false' }],
    constraints: ['-2^31 <= n <= 2^31 - 1'],
    starter_code: {
      python: 'class Solution:\n    def isPowerOfTwo(self, n: int) -> bool:\n        pass\n',
      javascript: 'function isPowerOfTwo(n) {\n  // Bit manipulation\n}\n'
    },
    hints: ['Powers of two have exactly one bit set. (n > 0) and (n & (n - 1) == 0).'],
    solution: 'Bitwise trick: n > 0 and (n & (n - 1)) == 0. Time O(1), Space O(1).',
    test_cases: [
      { input: '1', expected_output: 'true', is_hidden: 0 },
      { input: '16', expected_output: 'true', is_hidden: 0 },
      { input: '3', expected_output: 'false', is_hidden: 1 }
    ]
  },

  // MEDIUM (21-35)
  {
    title: '3Sum',
    slug: '3sum',
    difficulty: 'Medium',
    topic: 'Two Pointers',
    description: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0. The solution set must not contain duplicate triplets.',
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]' }
    ],
    constraints: ['3 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],
    starter_code: {
      python: 'class Solution:\n    def threeSum(self, nums: list[int]) -> list[list[int]]:\n        pass\n',
      javascript: 'function threeSum(nums) {\n  // Two pointers on sorted array\n}\n'
    },
    hints: ['Sort the array. Fix the first element and use two pointers for the remaining two.'],
    solution: 'Sort array. For each i, two pointers left = i+1 and right = len-1. Skip duplicates. Time O(N^2), Space O(1).',
    test_cases: [
      { input: '[-1,0,1,2,-1,-4]', expected_output: '[[-1, -1, 2], [-1, 0, 1]]', is_hidden: 0 },
      { input: '[0,1,1]', expected_output: '[]', is_hidden: 1 },
      { input: '[0,0,0]', expected_output: '[[0, 0, 0]]', is_hidden: 1 }
    ]
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    topic: 'Strings',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1' }
    ],
    constraints: ['0 <= s.length <= 5 * 10^4'],
    starter_code: {
      python: 'class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass\n',
      javascript: 'function lengthOfLongestSubstring(s) {\n  // Sliding window\n}\n'
    },
    hints: ['Use sliding window with a hash map storing last index of each character.'],
    solution: 'Sliding window tracking character indices. If character repeated, jump left pointer. Time O(N), Space O(min(N, M)).',
    test_cases: [
      { input: 'abcabcbb', expected_output: '3', is_hidden: 0 },
      { input: 'bbbbb', expected_output: '1', is_hidden: 0 },
      { input: 'pwwkew', expected_output: '3', is_hidden: 1 }
    ]
  },
  {
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: 'Medium',
    topic: 'Two Pointers',
    description: 'You are given an integer array height of length n. Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.',
    examples: [{ input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49' }],
    constraints: ['n == height.length', '2 <= n <= 10^5'],
    starter_code: {
      python: 'class Solution:\n    def maxArea(self, height: list[int]) -> int:\n        pass\n',
      javascript: 'function maxArea(height) {\n  // Two pointers left & right\n}\n'
    },
    hints: ['Start with pointers at both ends. Always advance the pointer pointing to the shorter line.'],
    solution: 'Two pointers maximizing width first, moving shorter height inward. Time O(N), Space O(1).',
    test_cases: [
      { input: '[1,8,6,2,5,4,8,3,7]', expected_output: '49', is_hidden: 0 },
      { input: '[1,1]', expected_output: '1', is_hidden: 1 }
    ]
  },
  {
    title: 'Product of Array Except Self',
    slug: 'product-of-array-except-self',
    difficulty: 'Medium',
    topic: 'Arrays & Hashing',
    description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. The algorithm must run in O(n) time and without using the division operation.',
    examples: [{ input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' }],
    constraints: ['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30'],
    starter_code: {
      python: 'class Solution:\n    def productExceptSelf(self, nums: list[int]) -> list[int]:\n        pass\n',
      javascript: 'function productExceptSelf(nums) {\n  // Prefix and postfix products\n}\n'
    },
    hints: ['Calculate prefix products from left, then multiply postfix products from right in a second pass.'],
    solution: 'Two passes: prefix pass computes products to the left, suffix pass multiplies products to the right. Time O(N), Space O(1) excluding output.',
    test_cases: [
      { input: '[1,2,3,4]', expected_output: '[24, 12, 8, 6]', is_hidden: 0 },
      { input: '[-1,1,0,-3,3]', expected_output: '[0, 0, 9, 0, 0]', is_hidden: 1 }
    ]
  },
  {
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    difficulty: 'Medium',
    topic: 'Arrays & Hashing',
    description: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.',
    examples: [{ input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }],
    constraints: ['1 <= strs.length <= 10^4'],
    starter_code: {
      python: 'class Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        pass\n',
      javascript: 'function groupAnagrams(strs) {\n  // Key by sorted string or char count\n}\n'
    },
    hints: ['Use the sorted version of each string as a key in a dictionary.'],
    solution: 'Hash map with sorted string key. Time O(N * K log K), Space O(N * K).',
    test_cases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expected_output: '[["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]', is_hidden: 0 }
    ]
  },
  {
    title: 'Top K Frequent Elements',
    slug: 'top-k-frequent-elements',
    difficulty: 'Medium',
    topic: 'Heap / Priority Queue',
    description: 'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.',
    examples: [{ input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1,2]' }],
    constraints: ['1 <= nums.length <= 10^5', 'k is in range [1, number of unique elements]'],
    starter_code: {
      python: 'class Solution:\n    def topKFrequent(self, nums: list[int], k: int) -> list[int]:\n        pass\n',
      javascript: 'function topKFrequent(nums, k) {\n  // Bucket sort or Min-heap\n}\n'
    },
    hints: ['Count frequencies with a hash map, then use Bucket Sort with frequencies as bucket indices.'],
    solution: 'Bucket sort by frequency array. Time O(N), Space O(N).',
    test_cases: [
      { input: '[1,1,1,2,2,3]\n2', expected_output: '[1, 2]', is_hidden: 0 },
      { input: '[1]\n1', expected_output: '[1]', is_hidden: 1 }
    ]
  },
  {
    title: 'Coin Change',
    slug: 'coin-change',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    description: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money. Return the fewest number of coins that you need to make up that amount. If that amount cannot be made up, return -1.',
    examples: [{ input: 'coins = [1,2,5], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1' }],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    starter_code: {
      python: 'class Solution:\n    def coinChange(self, coins: list[int], amount: int) -> int:\n        pass\n',
      javascript: 'function coinChange(coins, amount) {\n  // DP array of size amount + 1\n}\n'
    },
    hints: ['dp[i] = min(dp[i], dp[i - coin] + 1) for each coin <= i.'],
    solution: 'Bottom-up DP table tracking min coins for each sub-amount. Time O(amount * len(coins)), Space O(amount).',
    test_cases: [
      { input: '[1,2,5]\n11', expected_output: '3', is_hidden: 0 },
      { input: '[2]\n3', expected_output: '-1', is_hidden: 0 },
      { input: '[1]\n0', expected_output: '0', is_hidden: 1 }
    ]
  },
  {
    title: 'Longest Increasing Subsequence',
    slug: 'longest-increasing-subsequence',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    description: 'Given an integer array nums, return the length of the longest strictly increasing subsequence.',
    examples: [{ input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', explanation: 'The longest increasing subsequence is [2,3,7,101], therefore the length is 4.' }],
    constraints: ['1 <= nums.length <= 2500'],
    starter_code: {
      python: 'class Solution:\n    def lengthOfLIS(self, nums: list[int]) -> int:\n        pass\n',
      javascript: 'function lengthOfLIS(nums) {\n  // DP or Patience Sorting\n}\n'
    },
    hints: ['Patience sorting with binary search (bisect_left) achieves O(N log N).'],
    solution: 'Binary search with tails array (Patience sorting). Time O(N log N), Space O(N).',
    test_cases: [
      { input: '[10,9,2,5,3,7,101,18]', expected_output: '4', is_hidden: 0 },
      { input: '[0,1,0,3,2,3]', expected_output: '4', is_hidden: 1 }
    ]
  },
  {
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: 'Medium',
    topic: 'Graphs & BFS/DFS',
    description: 'Given an m x n 2D binary grid grid which represents a map of "1"s (land) and "0"s (water), return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
    examples: [{ input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' }],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300'],
    starter_code: {
      python: 'class Solution:\n    def numIslands(self, grid: list[list[str]]) -> int:\n        pass\n',
      javascript: 'function numIslands(grid) {\n  // DFS or BFS flood fill\n}\n'
    },
    hints: ['Traverse each cell. When you find "1", increment island count and DFS/BFS to sink connected land to "0".'],
    solution: 'DFS/BFS flood fill sinking visited lands. Time O(M * N), Space O(M * N).',
    test_cases: [
      { input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expected_output: '3', is_hidden: 0 }
    ]
  },
  {
    title: 'Course Schedule (Cycle Detection)',
    slug: 'course-schedule',
    difficulty: 'Medium',
    topic: 'Graphs & BFS/DFS',
    description: 'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [a_i, b_i] indicates that you must take b_i first if you want to take a_i. Return true if you can finish all courses, or false otherwise.',
    examples: [{ input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true' }, { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false' }],
    constraints: ['1 <= numCourses <= 2000'],
    starter_code: {
      python: 'class Solution:\n    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:\n        pass\n',
      javascript: 'function canFinish(numCourses, prerequisites) {\n  // Topological sort / Kahn algorithm\n}\n'
    },
    hints: ['Check for cycles in a directed graph using Kahn algorithm with in-degrees.'],
    solution: 'Topological sort (Kahn algorithm) using indegrees and BFS queue. Time O(V + E), Space O(V + E).',
    test_cases: [
      { input: '2\n[[1,0]]', expected_output: 'true', is_hidden: 0 },
      { input: '2\n[[1,0],[0,1]]', expected_output: 'false', is_hidden: 0 }
    ]
  },
  {
    title: 'Word Break',
    slug: 'word-break',
    difficulty: 'Medium',
    topic: 'Dynamic Programming',
    description: 'Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.',
    examples: [{ input: 's = "leetcode", wordDict = ["leet","code"]', output: 'true' }],
    constraints: ['1 <= s.length <= 300', '1 <= wordDict.length <= 1000'],
    starter_code: {
      python: 'class Solution:\n    def wordBreak(self, s: str, wordDict: list[str]) -> bool:\n        pass\n',
      javascript: 'function wordBreak(s, wordDict) {\n  // dp[i] represents if s[:i] can be segmented\n}\n'
    },
    hints: ['dp[i] is true if for some j < i, dp[j] is true and s[j:i] is in wordDict.'],
    solution: '1D DP array checking word substrings against set. Time O(N^2), Space O(N).',
    test_cases: [
      { input: 'leetcode\n["leet","code"]', expected_output: 'true', is_hidden: 0 },
      { input: 'applepenapple\n["apple","pen"]', expected_output: 'true', is_hidden: 1 }
    ]
  },
  {
    title: 'Kth Largest Element in an Array',
    slug: 'kth-largest-element-in-an-array',
    difficulty: 'Medium',
    topic: 'Heap / Priority Queue',
    description: 'Given an integer array nums and an integer k, return the kth largest element in the array. Note that it is the kth largest element in the sorted order, not the kth distinct element.',
    examples: [{ input: 'nums = [3,2,1,5,6,4], k = 2', output: '5' }],
    constraints: ['1 <= k <= nums.length <= 10^5'],
    starter_code: {
      python: 'class Solution:\n    def findKthLargest(self, nums: list[int], k: int) -> int:\n        pass\n',
      javascript: 'function findKthLargest(nums, k) {\n  // Min-heap of size k or QuickSelect\n}\n'
    },
    hints: ['Maintain a min-heap of size k. The top of the heap is the kth largest element.'],
    solution: 'Min-heap of size k. Time O(N log k), Space O(k).',
    test_cases: [
      { input: '[3,2,1,5,6,4]\n2', expected_output: '5', is_hidden: 0 },
      { input: '[3,2,3,1,2,4,5,5,6]\n4', expected_output: '4', is_hidden: 1 }
    ]
  },
  {
    title: 'Rotting Oranges',
    slug: 'rotting-oranges',
    difficulty: 'Medium',
    topic: 'Graphs & BFS/DFS',
    description: 'You are given an m x n grid where each cell can have one of three values: 0 representing an empty cell, 1 representing a fresh orange, or 2 representing a rotten orange. Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten. Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return -1.',
    examples: [{ input: 'grid = [[2,1,1],[1,1,0],[0,1,1]]', output: '4' }],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 10'],
    starter_code: {
      python: 'class Solution:\n    def orangesRotting(self, grid: list[list[int]]) -> int:\n        pass\n',
      javascript: 'function orangesRotting(grid) {\n  // Multi-source BFS\n}\n'
    },
    hints: ['Put all rotten oranges in a BFS queue initially. Process minute by minute.'],
    solution: 'Multi-source BFS from rotten oranges tracking elapsed minutes. Time O(M * N), Space O(M * N).',
    test_cases: [
      { input: '[[2,1,1],[1,1,0],[0,1,1]]', expected_output: '4', is_hidden: 0 },
      { input: '[[2,1,1],[0,1,1],[1,0,1]]', expected_output: '-1', is_hidden: 1 }
    ]
  },
  {
    title: 'SQL: Consecutive Logins',
    slug: 'sql-consecutive-logins',
    difficulty: 'Medium',
    topic: 'DBMS & SQL',
    description: 'Write an SQL query to find all users who logged in on at least two consecutive days.',
    examples: [{ input: 'login_logs table', output: 'user_id list with consecutive logins' }],
    constraints: ['Standard SQL query'],
    starter_code: {
      sql: 'SELECT DISTINCT l1.user_id\nFROM login_logs l1\nJOIN login_logs l2 ON l1.user_id = l2.user_id\nWHERE date(l2.login_time) = date(l1.login_time, "+1 day");\n'
    },
    hints: ['Self-join login_logs where date is +1 day apart.'],
    solution: 'Self join on date + 1 day difference.',
    test_cases: [
      { input: 'test', expected_output: '4', is_hidden: 0 }
    ]
  },
  {
    title: 'Subarray Sum Equals K',
    slug: 'subarray-sum-equals-k',
    difficulty: 'Medium',
    topic: 'Arrays & Hashing',
    description: 'Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k.',
    examples: [{ input: 'nums = [1,1,1], k = 2', output: '2' }],
    constraints: ['1 <= nums.length <= 2 * 10^4', '-1000 <= nums[i] <= 1000'],
    starter_code: {
      python: 'class Solution:\n    def subarraySum(self, nums: list[int], k: int) -> int:\n        pass\n',
      javascript: 'function subarraySum(nums, k) {\n  // Prefix sum hash map\n}\n'
    },
    hints: ['Store prefix sum frequencies in a hash map. Check for prefix_sum - k.'],
    solution: 'Prefix sum hash map. Time O(N), Space O(N).',
    test_cases: [
      { input: '[1,1,1]\n2', expected_output: '2', is_hidden: 0 },
      { input: '[1,2,3]\n3', expected_output: '2', is_hidden: 1 }
    ]
  },

  // HARD (36-40)
  {
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'Hard',
    topic: 'Two Pointers',
    description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    examples: [{ input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6' }],
    constraints: ['n == height.length', '1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
    starter_code: {
      python: 'class Solution:\n    def trap(self, height: list[int]) -> int:\n        pass\n',
      javascript: 'function trap(height) {\n  // Two pointers left_max & right_max\n}\n'
    },
    hints: ['Maintain left_max and right_max pointers. Water trapped at i depends on min(left_max, right_max) - height[i].'],
    solution: 'Two pointers converging from ends tracking left_max and right_max. Time O(N), Space O(1).',
    test_cases: [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expected_output: '6', is_hidden: 0 },
      { input: '[4,2,0,3,2,5]', expected_output: '9', is_hidden: 1 }
    ]
  },
  {
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    difficulty: 'Hard',
    topic: 'Searching',
    description: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).',
    examples: [{ input: 'nums1 = [1,3], nums2 = [2]', output: '2.0' }, { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.5' }],
    constraints: ['nums1.length == m', 'nums2.length == n', '0 <= m <= 1000', '0 <= n <= 1000'],
    starter_code: {
      python: 'class Solution:\n    def findMedianSortedArrays(self, nums1: list[int], nums2: list[int]) -> float:\n        pass\n',
      javascript: 'function findMedianSortedArrays(nums1, nums2) {\n  // Binary search partition\n}\n'
    },
    hints: ['Binary search on the smaller array to partition both arrays such that left side has equal elements and all smaller than right side.'],
    solution: 'Binary search partition on smaller array. Time O(log(min(M, N))), Space O(1).',
    test_cases: [
      { input: '[1,3]\n[2]', expected_output: '2.0', is_hidden: 0 },
      { input: '[1,2]\n[3,4]', expected_output: '2.5', is_hidden: 0 }
    ]
  },
  {
    title: 'Merge K Sorted Lists',
    slug: 'merge-k-sorted-lists',
    difficulty: 'Hard',
    topic: 'Heap / Priority Queue',
    description: 'You are given an array of k linked-lists lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.',
    examples: [{ input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' }],
    constraints: ['k == lists.length', '0 <= k <= 10^4'],
    starter_code: {
      python: 'class Solution:\n    def mergeKLists(self, lists: list) -> list:\n        pass\n',
      javascript: 'function mergeKLists(lists) {\n  // Min-heap or divide & conquer\n}\n'
    },
    hints: ['Use a min-heap to keep the minimum element among all current list heads, or divide and conquer merge pairs.'],
    solution: 'Min-heap storing current node values. Time O(N log k), Space O(k).',
    test_cases: [
      { input: '[[1,4,5],[1,3,4],[2,6]]', expected_output: '[1, 1, 2, 3, 4, 4, 5, 6]', is_hidden: 0 }
    ]
  },
  {
    title: 'Edit Distance',
    slug: 'edit-distance',
    difficulty: 'Hard',
    topic: 'Dynamic Programming',
    description: 'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. You have the following three operations permitted on a word: Insert a character, Delete a character, Replace a character.',
    examples: [{ input: 'word1 = "horse", word2 = "ros"', output: '3', explanation: 'horse -> rorse -> rose -> ros' }],
    constraints: ['0 <= word1.length, word2.length <= 500'],
    starter_code: {
      python: 'class Solution:\n    def minDistance(self, word1: str, word2: str) -> int:\n        pass\n',
      javascript: 'function minDistance(word1, word2) {\n  // 2D DP matrix\n}\n'
    },
    hints: ['dp[i][j] = 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]) if word1[i-1] != word2[j-1].'],
    solution: '2D DP matrix for Levenshtein distance. Time O(M * N), Space O(M * N).',
    test_cases: [
      { input: 'horse\nros', expected_output: '3', is_hidden: 0 },
      { input: 'intention\nexecution', expected_output: '5', is_hidden: 1 }
    ]
  },
  {
    title: 'N-Queens',
    slug: 'n-queens',
    difficulty: 'Hard',
    topic: 'Backtracking',
    description: 'The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other. Given an integer n, return all distinct solutions to the n-queens puzzle.',
    examples: [{ input: 'n = 4', output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]' }],
    constraints: ['1 <= n <= 9'],
    starter_code: {
      python: 'class Solution:\n    def solveNQueens(self, n: int) -> list[list[str]]:\n        pass\n',
      javascript: 'function solveNQueens(n) {\n  // Backtracking with columns and diagonals sets\n}\n'
    },
    hints: ['Maintain sets for cols, posDiag (r + c), and negDiag (r - c) as you place queens row by row.'],
    solution: 'Row-by-row backtracking with sets for columns and diagonals. Time O(N!), Space O(N^2).',
    test_cases: [
      { input: '4', expected_output: '[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]', is_hidden: 0 },
      { input: '1', expected_output: '[["Q"]]', is_hidden: 1 }
    ]
  }
];

function seedProblems() {
  console.log(`📦 Seeding ${problems.length} Practice Arena coding problems...`);

  const insertProb = db.prepare(`
    INSERT OR REPLACE INTO problems (title, slug, difficulty, topic, description, examples_json, constraints_json, starter_code_json, hints_json, solution_explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTest = db.prepare(`
    INSERT INTO test_cases (problem_id, input, expected_output, is_hidden)
    VALUES (?, ?, ?, ?)
  `);

  for (const p of problems) {
    const existing = db.prepare('SELECT id FROM problems WHERE slug = ?').get(p.slug);
    let problemId;
    if (existing) {
      problemId = existing.id;
      db.prepare(`
        UPDATE problems 
        SET title = ?, difficulty = ?, topic = ?, description = ?, examples_json = ?, constraints_json = ?, starter_code_json = ?, hints_json = ?, solution_explanation = ?
        WHERE id = ?
      `).run(
        p.title, p.difficulty, p.topic, p.description,
        JSON.stringify(p.examples), JSON.stringify(p.constraints),
        JSON.stringify(p.starter_code), JSON.stringify(p.hints),
        p.solution, problemId
      );
    } else {
      const info = insertProb.run(
        p.title, p.slug, p.difficulty, p.topic, p.description,
        JSON.stringify(p.examples), JSON.stringify(p.constraints),
        JSON.stringify(p.starter_code), JSON.stringify(p.hints),
        p.solution
      );
      problemId = info.lastInsertRowid;
    }

    // Insert test cases if not already present
    const testCount = db.prepare('SELECT COUNT(*) AS c FROM test_cases WHERE problem_id = ?').get(problemId).c;
    if (testCount === 0 && p.test_cases) {
      for (const tc of p.test_cases) {
        insertTest.run(problemId, tc.input, tc.expected_output, tc.is_hidden || 0);
      }
    }
  }

  console.log(`✅ ${problems.length} Practice Arena problems & test cases verified!`);
}

module.exports = { seedProblems, problems };

if (require.main === module) {
  seedProblems();
}
