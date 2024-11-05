// src/utils/priorityCalculator.js
export const calculatePriorityScore = (task) => {
    const currentDate = new Date();
    const deadlineDate = new Date(task.deadline);
    const timeUntilDeadline = (deadlineDate - currentDate) / (1000 * 60 * 60); // Convert to hours

    // Weighting factors (you can adjust these)
    const importanceWeight = 2; // High importance
    const deadlineWeight = 3; // Urgency
    const effortWeight = -1; // Lower effort is better

    // Calculate scores
    const deadlineScore = timeUntilDeadline <= 0 ? 0 : Math.max(0, 10 - timeUntilDeadline); // Score based on time until deadline
    const importanceScore = task.importance * importanceWeight;
    const effortScore = Math.max(0, 10 - task.effort) * effortWeight; // Higher effort = lower score

    // Calculate total score
    const totalScore = deadlineScore + importanceScore + effortScore;
    return totalScore;
};
