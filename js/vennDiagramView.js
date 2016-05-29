
var disease = (function(module) {

    /**
     * @param parentEl the selector for the element into which the vennDiagramView will be placed
     * @param graph data
     * @param totalPopulation some big number
     */
    module.vennDiagramView = function(parentEl, graph, totalPopulation) {

        var margin = {top: 10, right: 10, bottom: 10, left: 10};

        var colorScale = d3.scale.ordinal()
            .range(["#ff3300", "#00ee11", "#cc0044", disease.POSITIVE_COLOR, "#00ff00"])
            .domain(["diseased", "healthy", "test-negative-diseased", "test-positive", "test-negative-healthy"]);

        var my = {};


        /** Add the initial svg structure */
        function init() {
            // append the svg canvas to the page
            var svg = d3.selectAll(parentEl).append("svg")
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

            svg.append("circle")
                .attr("class", "population-circle")
                .attr("cx", 150).attr("cy", 150).attr("r", 200)
                .attr("opacity", 0.6).attr("fill", "#eeff00");
            svg.append("circle")
                .attr("class", "test-positive-circle")
                .attr("cx", 260).attr("cy", 110).attr("r", 120)
                .attr("opacity", 0.6).attr("fill", "#ddbb00");
            svg.append("circle")
                .attr("class", "diseased-circle")
                .attr("cx", 320).attr("cy", 160).attr("r", 60)
                .attr("opacity", 0.6).attr("fill", "#dd0000");
        }


        /** update the sanky diagram */
        my.render = function() {
            var chartWidth = $(parentEl).width();
            var chartHeight = $(parentEl).height();

            var svg = d3.select(parentEl + " svg")
                .attr("width", chartWidth)
                .attr("height", chartHeight);

            var bayesRule = $(".bayes-rule-exp");
            var numPositiveAndDiseased = graph.links[1].value;
            var numPositiveAndHealthy =  graph.links[2].value;
            var numDiseased = graph.links[0].value + numPositiveAndDiseased;
            var numPositive = numPositiveAndDiseased + numPositiveAndHealthy;
            var probPositiveGivenDiseased = numPositiveAndDiseased / numDiseased;
            //var probDiseasedGivenPositive = (100 * numDiseased * probPositiveGivenDiseased) / numPositive;

            var testPositiveRad = 128;
            var scaleFactor = totalPopulation / numPositive;
            var diseasedRad = testPositiveRad * numDiseased / numPositive;

            svg.select("circle.population-circle").attr("r", testPositiveRad * scaleFactor);
            svg.select("circle.test-positive-circle").attr("r", testPositiveRad);
            svg.select("circle.diseased-circle").attr("r", diseasedRad);
        };

        /**
         * Given circle A with radiusA, and circle B with radiusB, and a desired amount of overlap,
         * find the distance between the center of A and B.
         *
         * Circle A is at the origin. Circle B starts radA + radB to the right where intersection = 0.
         * When they are both at the origin, the overlap is min(areaA, areaB)
         * Move them closer until the amount of overlap is equal to the support.
         *
         * @param circleInfo radiusA, radiusB, overlap
         * @return the center distance between circles A and B.
         */
        var findCircleSeparation = function(circleInfo) {

            var radA = circleInfo.radiusA;
            var radB = circleInfo.radiusB;
            var radAsq = radA * radA;
            var radBsq = radB * radB;
            var maxDistance = radA + radB;
            var maxOverlap = Math.PI * Math.min(radAsq, radBsq);

            // This function returns the area of intersection when the two circles are x apart.
            var y = function (x) {
                if (x == 0) {
                    return maxOverlap;
                }
                var cosCBD = (radBsq + x * x - radAsq) / (2.0 * radB * x);
                var cosCAD = (radAsq + x * x - radBsq) / (2.0 * radA * x);
                if (Math.abs(cosCBD) > 1 || Math.abs(cosCAD) > 1) {
                    // then the two circles do not intersect at all
                    return maxOverlap;
                }
                var angleCBD = 2.0 * Math.acos(cosCBD);
                var angleCAD = 2.0 * Math.acos(cosCAD);
                return 0.5 * (angleCBD * radBsq - radBsq * Math.sin(angleCBD)
                    + angleCAD * radAsq - radAsq * Math.sin(angleCAD));
            };

            return findXForY(circleInfo.support, y, maxDistance, maxOverlap);
        };

        /**
         * @param overlap the overlapping area value we want to find x for.
         * @param y the function of x that will yield the support value.
         * @param maxDistance the maximum distance the two circles can be appart before they no longer overlap.
         * @param maxOverlap the maximum amount of overlap possible. The min of the two circle areas.
         * @return the x value for the given y(x)
         */
        var findXForY = function(overlap, y, maxDistance, maxOverlap) {

            // if they totally overlay, then we know the distance is 0;
            if (overlap == maxOverlap) {
                return 0;
            }
            var lower = 0;
            var upper = maxDistance;
            var currentGuess = maxDistance / 2.0;
            var currentY = y(currentGuess);
            if (isNaN(currentY)) {
                throw "y is NaN for " + currentGuess;
            }
            var EPS = 0.0001;
            // if an answer is not found after 20 iterations something is wrong
            var MAX_ITERATIONS = 20;
            var ct = 0;

            while (Math.abs(overlap - currentY) > EPS && ct++ < MAX_ITERATIONS) {
                if (currentY > overlap) {
                    // then move circles further apart
                    currentGuess = (upper + currentGuess) / 2;
                }
                else {
                    // then move circles closer together
                    currentGuess = (lower + currentGuess) / 2;
                }
                currentY = y(currentGuess);
                if (currentY > overlap) {
                    lower = currentGuess;
                }
                else {
                    upper = currentGuess;
                }
            }

            if (ct >= MAX_ITERATIONS) {
                throw "It was not possible to find the separation for overlap = " + overlap + " when maxOverlap is "
                + maxOverlap + " and maxDistance is " + maxDistance + ". Current range = [" + lower + ", " + upper + "]";
            }
            return currentGuess;
        };

        init();
        return my;
    };


    return module;
} (disease || {}));