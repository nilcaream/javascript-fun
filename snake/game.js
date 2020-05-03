class Game {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.reward = 2 * Math.floor(Math.sqrt(width * width + height * height));
        this.snake = new Snake(Math.floor(width / 2), Math.floor(height / 2), 4);
        this.apple = this.createApple();
        this.points = 0;
        this.lives = this.reward;
        this.age = 0;
    }

    createApple() {
        let point = this.createRandomPoint();
        while (this.snake.contains(point)) {
            point = this.createRandomPoint();
        }
        return point;
    }

    createRandomPoint() {
        return { x: Math.floor(Math.random() * this.width), y: Math.floor(Math.random() * this.height) };
    }

    step(dx, dy) {
        const head = this.snake.grow(dx, dy);
        if (head.x === this.apple.x && head.y === this.apple.y) {
            this.points++;
            this.lives += this.reward;
            this.apple = this.createApple();
        } else if (this.snake.hasEatenTail() || this.snake.hasHitWall(0, this.width, 0, this.height)) {
            this.lives = 0;
        } else {
            this.snake.shrink();
            this.lives--;
        }
        this.age++;
        return this.lives > 0;
    }
}
