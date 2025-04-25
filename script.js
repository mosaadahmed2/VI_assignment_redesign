const attributeNames = {
    "percent_coronary_heart_disease": "Heart Disease (%)",
    "percent_inactive": "Physical Inactivity (%)",
    "percent_high_cholesterol": "Cholesterol (%)",
    "percent_smoking": "Smoking (%)",
    
    "poverty_perc": "Poverty Rate (%)",
    "median_household_income": "Median Income ($)"
};

document.addEventListener("DOMContentLoaded", function () {
    const width = 600, height = 400;
    const margin = { top: 40, right: 40, bottom: 50, left: 70 };

    const scatterSvg = d3.select("#scatterplot").append("svg").attr("width", width).attr("height", height);
    const histWidth = 400, histHeight = 350;

    const inactiveHistSvg = d3.select("#inactive-histogram").append("svg").attr("width", histWidth).attr("height", histHeight);
    const heartHistSvg = d3.select("#heart-disease-histogram").append("svg").attr("width", histWidth).attr("height", histHeight);
    const mapSvg = d3.select("#map").append("svg").attr("width", width).attr("height", height);

    let currentXAttribute = "percent_inactive";
    let currentYAttribute = "percent_coronary_heart_disease";
    let filteredData = [];  

    const attributeColors = {
        "percent_inactive": "#4FC3F7",
        "percent_coronary_heart_disease": "#F06292",
        "percent_high_cholesterol": "#81C784",
        "percent_smoking": "#BA68C8",
    
        "poverty_perc": "#FFB74D",
        "median_household_income": "#64B5F6"
    };

    const attributeNames = {
        "percent_inactive": "Physical Inactivity (%)",
        "percent_coronary_heart_disease": "Heart Disease (%)",
        "percent_high_cholesterol": "Cholesterol (%)",
        "percent_smoking": "Smoking (%)",
        
        "poverty_perc": "Poverty Rate (%)",
        "median_household_income": "Median Income ($)"
    };

    const tooltip = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("font-size", "14px");

    d3.csv("national_health_data_2024.csv").then(data => {
        data.forEach(d => {
            d.id = d.cnty_fips; 
            d.percent_inactive = +d.percent_inactive;
            d.percent_coronary_heart_disease = +d.percent_coronary_heart_disease;
            d.percent_high_cholesterol = +d.percent_high_cholesterol;
            d.percent_smoking = +d.percent_smoking
            d.poverty_perc = +d.poverty_perc
            d.median_household_income = +d.median_household_income;
        });
        data = data.filter(d =>
            isFinite(d[currentXAttribute]) &&
            isFinite(d[currentYAttribute]) &&
            d[currentXAttribute] !== 0 &&
            d[currentYAttribute] !== 0
        );
        

        filteredData = data;

        const dropdown = d3.select("#scatter-dropdown");
        Object.keys(attributeNames).forEach(attr => {
            dropdown.append("option").attr("value", attr).text(attributeNames[attr]);
        });

        const dropdownY = d3.select("#scatter-y-dropdown");
Object.keys(attributeNames).forEach(attr => {
    dropdownY.append("option")
        .attr("value", attr)
        .property("selected", attr === currentYAttribute)  
        .text(attributeNames[attr]);
});


        function updateVisualizations() {
            updateScatterplot();
            updateHistogram(inactiveHistSvg, currentXAttribute,currentYAttribute);
            updateMap(); 
            updateBigNumberPanel(filteredData, currentXAttribute);
        }

        function updateScatterplot() {
            const xScale = d3.scaleLinear()
                .domain(d3.extent(data, d => d[currentXAttribute]))
                
                .range([margin.left, width - margin.right])
                
                
        
            const yScale = d3.scaleLinear()
                .domain(d3.extent(data, d => d[currentYAttribute]))
                
                .range([height - margin.bottom, margin.top])
                

                console.log("Max poverty:", d3.max(data, d => d.poverty_perc));
console.log("Max income:", d3.max(data, d => d.median_household_income));

        
            scatterSvg.selectAll("g").remove();
        
            scatterSvg.append("g")
                .attr("transform", `translate(0, ${height - margin.bottom})`)
                .call(d3.axisBottom(xScale));
        
            scatterSvg.append("g")
                .attr("transform", `translate(${margin.left}, 0)`)
                .call(d3.axisLeft(yScale));

               // Add or update X-axis label
            let xLabel = scatterSvg.select(".x-axis-label");
            if (xLabel.empty()) {
                xLabel = scatterSvg.append("text")
                    .attr("class", "x-axis-label")
                    .attr("x", width / 2)
                    .attr("y", height - 5)
                    .attr("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("fill", "#333");
            }
            xLabel.text(attributeNames[currentXAttribute]);

            // Add or update Y-axis label
            let yLabel = scatterSvg.select(".y-axis-label");
            if (yLabel.empty()) {
                yLabel = scatterSvg.append("text")
                    .attr("class", "y-axis-label")
                    .attr("transform", "rotate(-90)")
                    .attr("x", -height / 2)
                    .attr("y", 20)
                    .attr("text-anchor", "middle")
                    .style("font-size", "14px")
                    .style("fill", "#333");
            }
            yLabel.text(attributeNames[currentYAttribute]);
        
            const points = scatterSvg.selectAll("circle")
                .data(filteredData, d => d.id);

            
        
            
            points.enter()
                .append("circle")
                .attr("cx", d => xScale(d[currentXAttribute]))
                .attr("cy", d => yScale(d[currentYAttribute]))
                .attr("r", 0)  
                .attr("fill", attributeColors[currentXAttribute])  
                .attr("opacity", 0.7)
                .merge(points)  
                .transition().duration(800).ease(d3.easeCubicInOut)
                .attr("cx", d => xScale(d[currentXAttribute]))
                .attr("cy", d => yScale(d[currentYAttribute]))
                .attr("r", 5)
                .attr("fill", attributeColors[currentXAttribute]);  
        
            
            points.exit()
                .transition().duration(500)
                .attr("r", 0)
                .remove();
        
            
           // DEFINE and ATTACH brush
            const brush = d3.brush()
            .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])
            .on("brush", brushedScatter)
            .on("end", brushedScatterEnd);

            scatterSvg.append("g")
            .attr("class", "brush")
            .call(brush);

            function brushedScatter({ selection }) {
            if (!selection) return;

            const [[x0, y0], [x1, y1]] = selection;

            scatterSvg.selectAll("circle")
                .attr("opacity", d =>
                    xScale(d[currentXAttribute]) >= x0 && xScale(d[currentXAttribute]) <= x1 &&
                    yScale(d[currentYAttribute]) >= y0 && yScale(d[currentYAttribute]) <= y1
                        ? 0.9 : 0.1
                );
            }

            function brushedScatterEnd({ selection }) {
            if (!selection) {
                scatterSvg.selectAll("circle").attr("opacity", 0.7); // Reset opacity
                return;
            }

            const [[x0, y0], [x1, y1]] = selection;

            filteredData = data.filter(d =>
                xScale(d[currentXAttribute]) >= x0 && xScale(d[currentXAttribute]) <= x1 &&
                yScale(d[currentYAttribute]) >= y0 && yScale(d[currentYAttribute]) <= y1
            );

            updateHistogram(inactiveHistSvg, currentXAttribute);
            updateMap();
            updateBigNumberPanel(filteredData, currentXAttribute);


}
        }
        
        

        
        

        function updateHistogram(svg, dataKey) {
            const updatedHistHeight = 330; // increased height to make room for X label
        
            svg.selectAll("*").remove(); // Clear previous content
        
            const x = d3.scaleLinear()
                .domain(d3.extent(filteredData, d => d[dataKey]))
                .range([0, histWidth - 100]);
        
            const bins = d3.bin()
                .domain(x.domain())
                .thresholds(20)(filteredData.map(d => d[dataKey]));
        
            const y = d3.scaleLinear()
                .domain([0, d3.max(bins, d => d.length)])
                .range([updatedHistHeight - 50, 0]);
        
            const g = svg.append("g").attr("transform", "translate(50,30)");
        
            // Axes
            g.append("g")
                .attr("transform", `translate(0, ${updatedHistHeight - 50})`)
                .call(d3.axisBottom(x));
        
            g.append("g")
                .call(d3.axisLeft(y));
        
            // Bars
            const bars = g.selectAll("rect")
                .data(bins, d => d.x0);

            
        
            bars.enter()
                .append("rect")
                .attr("x", d => x(d.x0))
                .attr("y", updatedHistHeight - 50)
                .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))

                .attr("height", 0)
                .attr("fill", attributeColors[dataKey])
                .attr("opacity", 0.7)
                .merge(bars)
                .transition().duration(700).ease(d3.easeCubicInOut)
                .attr("y", d => y(d.length))
                .attr("height", d => updatedHistHeight - 50 - y(d.length));
        
            bars.exit()
                .transition().duration(500)
                .attr("height", 0)
                .attr("y", updatedHistHeight - 50)
                .remove();

            // Remove any existing labels to avoid duplication
g.selectAll(".bar-label").remove();

// Add new labels above bars
g.selectAll(".bar-label")
    .data(bins)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("x", d => x(d.x0) + ((x(d.x1) - x(d.x0)) / 2))
    .attr("y", d => y(d.length) - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "#333")
    .text(d => {
        const width = x(d.x1) - x(d.x0);
        return (width > 12 && d.length > 0) ? d.length : ""; // Show only if wide enough
    });



            // Tooltip
            const total = d3.sum(bins, bin => bin.length); // total for % calculation

            g.selectAll("rect")
            .on("mouseover", function (event, d) {
                d3.select(this)
            .attr("stroke", "#333")
            .attr("stroke-width", 1.5)
            .attr("fill", d3.color(d3.select(this).attr("fill")).darker(1));
                const binMidpoint = ((d.x0 + d.x1) / 2).toFixed(1);
                const percent = ((d.length / total) * 100).toFixed(2);
            
                tooltip.transition().duration(200).style("opacity", 1);
                tooltip.html(`
                <strong>${attributeNames[dataKey]}</strong><br/>
                Range: <b>${d.x0.toFixed(1)}%</b> - <b>${d.x1.toFixed(1)}%</b><br/>
                Count: <b>${d.length}</b><br/>
                Proportion: <b>${percent}%</b><br/>
                Midpoint: <b>${binMidpoint}%</b>
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", function () {
                d3.select(this)
            .attr("stroke", null)
            .attr("stroke-width", null)
            .attr("fill", d => attributeColors[dataKey]);
                tooltip.transition().duration(500).style("opacity", 0);
            });

            
        
            // X-axis label
            svg.selectAll(".x-axis-label").remove();
            svg.append("text")
                .attr("class", "x-axis-label")
                .attr("x", histWidth / 2)
                .attr("y", updatedHistHeight + 15)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("fill", "#333")
                .text(attributeNames[dataKey]);
        
            // Y-axis label
            svg.selectAll(".y-axis-label").remove();
            svg.append("text")
                .attr("class", "y-axis-label")
                .attr("transform", "rotate(-90)")
                .attr("x", -updatedHistHeight / 2)
                .attr("y", 15)
                .attr("text-anchor", "middle")
                .style("font-size", "14px")
                .style("fill", "#333")
                .text("Count");

        }
        

        function updateMap() {
            d3.json("counties-10m.json").then(us => {
                const projection = d3.geoAlbersUsa()
                    .fitSize([width, height], topojson.feature(us, us.objects.counties)) // Automatically fits the map to container size
                    .scale(width * 1.2);  // Adjust scale to fit properly
        
                const path = d3.geoPath().projection(projection);
        
                const colorScale = d3.scaleSequential(d3.interpolateRdBu).domain(d3.extent(data, d => d[currentXAttribute]));
        
                mapSvg.selectAll("path")
                    .data(topojson.feature(us, us.objects.counties).features)
                    .join("path")
                    .attr("d", path)
                    .attr("fill", d => {
                        const county = filteredData.find(c => c.id == d.id);
                        return county ? colorScale(county[currentXAttribute]) : "#ddd";
                    })
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 0.3);
            

                    mapSvg.selectAll(".brush").remove(); // clear any existing brush

                    const brush = d3.brush()
                        .extent([[0, 0], [width, height]])
                        .on("brush", brushedMap)
                        .on("end", brushedMapEnd);
                    
                    mapSvg.append("g")
                        .attr("class", "brush")
                        .call(brush);

                    
                    
                    // Brush behavior
                    function brushedMap(event) {
                        const selection = event.selection;
                        if (!selection) return;
                    
                        const [[x0, y0], [x1, y1]] = selection;
                    
                        const allCounties = topojson.feature(us, us.objects.counties).features;
                    
                        const selectedIds = allCounties.filter(d => {
                            const [cx, cy] = path.centroid(d);
                            return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
                        }).map(d => d.id);
                    
                        // Update filteredData before computing color scale
                        filteredData = data.filter(d => selectedIds.includes(d.id));
                    
                        //Recompute color scale for filtered data
                        const colorScale = d3.scaleSequential(d3.interpolateRdBu)
                            .domain(d3.extent(data, d => d[currentXAttribute]));
                    
                        // Now re-render paths with the updated scale
                        mapSvg.selectAll("path")
                            .data(allCounties)
                            .join("path")
                            .attr("d", path)
                            .attr("fill", d => {
                                const county = filteredData.find(c => c.id == d.id);
                                return county ? colorScale(county[currentXAttribute]) : "#eee";
                            })
                            .attr("stroke", "#fff")
                            .attr("stroke-width", 0.3);
                    }
                    
                    
                    
                    // respond to brush end
                    function brushedMapEnd(event) {
                        const selection = event.selection;
                    
                        if (!selection) return;
                    
                        const [[x0, y0], [x1, y1]] = selection;
                    
                        const selectedIds = topojson.feature(us, us.objects.counties).features.filter(d => {
                            const [cx, cy] = path.centroid(d);
                            return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
                        }).map(d => d.id);
                    
                        filteredData = data.filter(d => selectedIds.includes(d.id));
                    
                        updateScatterplot(); // reflect selection in scatter
                        updateHistogram(inactiveHistSvg, currentXAttribute);
                        
                        updateBigNumberPanel(filteredData, currentXAttribute);
                    }       
                    // Remove old legend if it exists
        mapSvg.selectAll(".legend").remove();

        // Add legend group
        const legendWidth = 200;
        const legendHeight = 12;
        const legendX = width - legendWidth - 390;
        const legendY = height - 30;

        const legendGroup = mapSvg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${legendX}, ${legendY})`);

        // Define gradient for legend
        const defs = mapSvg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "legend-gradient");

        linearGradient.selectAll("stop")
            .data(d3.ticks(0, 1, 10))  // 10 color stops
            .enter().append("stop")
            .attr("offset", d => `${d * 100}%`)
            .attr("stop-color", d => d3.interpolateRdBu(d));

        // Append legend bar
        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#legend-gradient)")
            .style("stroke", "#ccc");

        // Create legend scale (same domain as the color scale)
        const legendScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d[currentXAttribute])) 
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d => `${d.toFixed(1)}%`);

        legendGroup.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis)
            .selectAll("text")
            .style("font-size", "10px");

        // Add label
        legendGroup.append("text")
            .attr("x", legendWidth / 2)
            .attr("y", -6)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("fill", "#333")
            .text(attributeNames[currentXAttribute]);
                    
                        
                    });
        }

        dropdown.on("change", function () {
            currentXAttribute = this.value;
            filteredData = data;
            updateVisualizations();
            
        });

        dropdownY.on("change", function () {
    currentYAttribute = this.value;
    filteredData = data;
    updateVisualizations();
});
updateVisualizations(); // Initial render
     
    });
});

function updateBigNumberPanel(filteredData, currentXAttribute) {
    const avg = d3.mean(filteredData, d => d[currentXAttribute]);

    if (!isFinite(avg)) {
        d3.select("#big-number-value").text("--");
        d3.select("#big-number-label").text("No data available");
        return;
    }

    const label = attributeNames[currentXAttribute] || currentXAttribute;
    const formatted = currentXAttribute.includes("income")
        ? `$${Math.round(avg).toLocaleString()}`
        : `${avg.toFixed(1)}%`;

    d3.select("#big-number-value").text(formatted);
    d3.select("#big-number-label").text(`Avg. ${label} in Selected Area`);
}
