// loyaltyPointsService.js

class LoyaltyPointsService {
    constructor() {
        this.points = {};
    }

    // Method to earn points on purchases
    earnPoints(customerId, amountSpent) {
        const pointsEarned = Math.floor(amountSpent / 10); // 1 point for every $10 spent
        this.points[customerId] = (this.points[customerId] || 0) + pointsEarned;
        return this.points[customerId];
    }

    // Method to redeem points
    redeemPoints(customerId, pointsToRedeem) {
        if (!this.points[customerId] || this.points[customerId] < pointsToRedeem) {
            throw new Error('Insufficient points to redeem.');
        }
        this.points[customerId] -= pointsToRedeem;
        return this.points[customerId];
    }

    // Method to get points balance
    getPointsBalance(customerId) {
        return this.points[customerId] || 0;
    }
}

module.exports = LoyaltyPointsService;