import { test, expect } from '@playwright/test';

test.describe('EduSync Golden Path (Teacher -> Student -> Teacher -> Student)', () => {
  const teacherEmail = 'teacher1@school.test';
  const studentEmail = 'student@school.test';
  const password = 'Passw0rd!';
  
  // Use a unique title so tests don't overlap if run multiple times
  const uniqueTitle = `E2E Test Assignment ${Date.now()}`;

  test('Complete Golden Path', async ({ page }) => {
    test.setTimeout(90000); // 90 seconds timeout for full E2E flow
    
    // ==========================================
    // 1. TEACHER: CREATE ASSIGNMENT
    // ==========================================
    await page.goto('/login');
    await page.waitForTimeout(500);
    
    // Login as Teacher
    await page.fill('#email-input', teacherEmail);
    await page.fill('#password-input', password);
    await page.waitForTimeout(500);
    await page.click('#login-submit-btn');
    
    // Ensure dashboard loads
    await expect(page).toHaveURL('/teacher');
    
    // Navigate to Assignments
    await page.goto('/teacher/assignments');
    
    // Create new assignment
    await page.click('#create-assignment-btn');
    
    // Fill out the modal
    await page.fill('#assignment-title-input', uniqueTitle);
    await page.fill('#assignment-description-input', 'This is an automated E2E test assignment.');
    
    // Make sure we select Grade 10 - A (the value might be a guid, so we select by label if possible)
    // We can also just leave the default if it auto-selects the first one which is Class A.
    // We know 'student@school.test' belongs to Class A.
    // The <select> options have the class name as text.
    await page.locator('#assignment-class-select').selectOption({ label: 'Grade 10 - A' });
    
    // Date input might be tricky to fill exactly, let's just use JS to set value or type normally
    // The format is datetime-local (yyyy-mm-ddThh:mm)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().slice(0, 16);
    await page.fill('#assignment-deadline-input', dateString);
    
    await page.fill('#assignment-maxmarks-input', '100');
    
    // Check publish immediately (it defaults to true, but let's be sure)
    const publishCheckbox = page.locator('#assignment-publish-immediately');
    if (!(await publishCheckbox.isChecked())) {
      await publishCheckbox.check();
    }

    // Save
    await page.click('#save-assignment-btn');
    
    // Wait for it to appear in the list
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
    
    // Logout
    await page.click('#sidebar-logout-btn');
    await expect(page).toHaveURL('/login');

    // ==========================================
    // 2. STUDENT: SUBMIT ASSIGNMENT
    // ==========================================
    // Login as Student
    await page.fill('#email-input', studentEmail);
    await page.fill('#password-input', password);
    await page.waitForTimeout(500);
    await page.click('#login-submit-btn');
    
    await expect(page).toHaveURL('/student');
    
    // Navigate to Class Tasks (Assignments)
    await page.goto('/student/assignments');
    
    // Find our unique assignment row and click Submit
    const assignmentRow = page.locator('tr', { hasText: uniqueTitle });
    const submitBtn = assignmentRow.locator('button', { hasText: 'Submit Work' });
    await submitBtn.click();
    
    // Fill out submission
    await page.fill('#submission-content-input', 'This is my E2E test submission answer.');
    await page.click('#submit-assignment-btn');
    
    // Wait for status to change to 'Submitted'
    await expect(assignmentRow.locator('text=Submitted')).toBeVisible();
    
    // Logout
    await page.click('#sidebar-logout-btn');
    await expect(page).toHaveURL('/login');

    // ==========================================
    // 3. TEACHER: GRADE SUBMISSION
    // ==========================================
    // Login as Teacher
    await page.fill('#email-input', teacherEmail);
    await page.fill('#password-input', password);
    await page.waitForTimeout(500);
    await page.click('#login-submit-btn');
    
    await expect(page).toHaveURL('/teacher');
    
    // Go to submissions
    await page.goto('/teacher/submissions');
    
    // Search for the unique assignment title or just find the student's submission
    const submissionRow = page.locator('tr', { hasText: uniqueTitle });
    const gradeBtn = submissionRow.locator('button', { hasText: 'Evaluate' });
    await gradeBtn.click();
    
    // Grade it
    await page.fill('#grade-marks-input', '95');
    await page.fill('#grade-feedback-input', 'Excellent automated work!');
    await page.click('#save-grade-submit-btn');
    
    // Verify it says Graded
    await expect(submissionRow.locator('text=Graded')).toBeVisible();

    // Logout
    await page.click('#sidebar-logout-btn');
    await expect(page).toHaveURL('/login');

    // ==========================================
    // 4. STUDENT: VERIFY GRADE
    // ==========================================
    // Login as Student
    await page.fill('#email-input', studentEmail);
    await page.fill('#password-input', password);
    await page.waitForTimeout(500);
    await page.click('#login-submit-btn');
    
    await expect(page).toHaveURL('/student');
    
    // Verify Teacher Feedback card shows up on dashboard
    await expect(page.locator('h2', { hasText: 'Teacher Feedback' })).toBeVisible();
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
    await expect(page.locator('text=Excellent automated work!').first()).toBeVisible();
    await expect(page.locator('text=95 / 100 pts').first()).toBeVisible();
    
    console.log('Golden Path E2E Test Passed Successfully!');
  });
});
