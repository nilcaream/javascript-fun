class Genetic {
    constructor(work) {
        this.results = [];
    }

    runSingle(iterations) {
        for (let i = 0; i < iterations; i++) {
            // object with score number and weights array
            this.results.push(work.run());
        }
    }

    chooseBest(fraction) {
        const number = Math.floor(this.results.length * fraction);
        return this.results.sort((a, b) => b.score - a.score).slice(0, number);
    }

    static crossover(weightsA, weightsB, selector, mutator) {
        const results = [];
        for (let i = 0; i < weightsA.length; i++) {
            const weightsI = [];
            for (let j = 0; j < weightsA[i].length; j++) {
                const weightsJ = [];
                for (let k = 0; k < weightsA[i][j].length; k++) {
                    const weights = selector() ? weightsA : weightsB;
                    const weight = mutator(weights[i][j][k]);
                    weightsJ.push(weight);
                }
                weightsI.push(weightsJ);
            }
            results.push(weightsI);
        }
        return results;
    }

    static test() {
        const assert = (actual, expected) => {
            const actualJson = JSON.stringify(actual);
            const expectedJson = JSON.stringify(expected);
            if (actualJson !== expectedJson) {
                throw `Fail: actual='${actualJson}', expected='${expectedJson}'`;
            }
        }
        // --------
        let x = 0;
        let weightsA = Neural.createWeights([2, 3, 4], () => ++x);
        let weightsB = Neural.createWeights([2, 3, 4], () => 1);
        let crossover = Genetic.crossover(weightsA, weightsB, () => true, (x) => x);
        assert(crossover, weightsA);
        crossover = Genetic.crossover(weightsA, weightsB, () => false, (x) => x);
        assert(crossover, weightsB);
        crossover = Genetic.crossover(weightsA, weightsB, () => true, () => 5);
        assert(crossover, Neural.createWeights([2, 3, 4], () => 5));
        crossover = Genetic.crossover(weightsA, weightsB, () => false, () => 7);
        assert(crossover, Neural.createWeights([2, 3, 4], () => 7));
    }
}

Genetic.test();

class Work {

}
