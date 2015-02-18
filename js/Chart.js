d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

function Chart(data,options) {

	console.log("Chart",data,options)

	data=d3.entries(data);
	
	console.log(options.distances)

	var container=d3.select(options.container);

	var WIDTH=options.width || 300,
		HEIGHT=options.height || 200;

	var margins={
		top:10,
		bottom:50,
		left:options.align=="left"?100:50,
		right:options.align=="left"?50:100
	}

	var padding={
		top:0,
		bottom:20,
		left:20,
		right:20	
	}

	var xscale=d3.scale.linear().domain([0,options.max_x]).range([padding.left,WIDTH-(margins.left+margins.right+padding.left+padding.right)]),
		yscale=d3.scale.linear().domain([0,options.max_y]).range([HEIGHT-(margins.bottom+margins.top+padding.top+padding.bottom),padding.bottom])

	if(options.invertedAxis) {
		yscale.domain([options.max_y,0])
	}

	var season_extent=d3.extent(data,function(d){return +d.key;});
	var YEAR=season_extent[1];

	var chart=container.append("div")
				.attr("class","distance-chart");

	

	var title=d3.select("div#title h4")
		.text(options.league.league+" - "+options.league.country);//+" "+d3.median(data))

	var svg=chart.append("div")
				.attr("class","chart")
				.append("svg")
					.attr("width",WIDTH)
					.attr("height",HEIGHT);
	var tooltip=new Tooltip(options);

	var grid=svg.append("g")
				.attr("id","grid")
				.classed("left",options.align=="left")
					.attr("transform","translate("+margins.left+","+(margins.top+padding.top)+")");

	var chart=svg.append("g")
				.attr("id","chart")
				.classed("left",options.align=="left")
					.attr("transform","translate("+margins.left+","+(margins.top+padding.top)+")");
	
	

	var seasons=chart.selectAll("g.season")
					.data(data.sort(options.sorting?options.sorting:function(a,b){
						var indexA=a.value.length-1,
							indexB=b.value.length-1;

						if(options.align=="left") {
							indexA=options.min_x || 0;
							indexB=options.min_x || 0;
						}
						if(options.invertedAxis) {
							return a.value[indexA] - b.value[indexB];
						}
						return b.value[indexB] - a.value[indexA];
					}).map(function(d){
						//console.log("------------->",d)
						d.value=d.value.map(function(v,i){
									return {
										day:i,
										value:v
									}	
								}).filter(function(v){
									return v.day>=options.min_x;
								})
						return d;
					}))
					.enter()
					.append("g")
						.attr("class","season")
						.classed("selected",function(d){
							return d.key==YEAR;
						})
						.attr("id",function(d){
							return "s"+d.key
						})
						.on("click",function(d){
							YEAR=d.key;
							seasons.classed("selected",false)
							d3.select(this)
								.classed("selected",true)
								.moveToFront();
						})
	seasons.filter(function(d){
		return d.key==YEAR;
	}).moveToFront();

	var avg=chart.append("g")
				.attr("id","avg");

	

	var line = d3.svg.line()
	    .x(function(d,i) { return xscale(d.day); })
	    .y(function(d,i) { return yscale(d.value); })
	   
	if(options.interpolate) {
	    line.interpolate(options.interpolate);
	}

	//var color=d3.scale.quantize().domain([1993,2013]).range(["#0000ff","#00ff00","#a0091d"])
	var color=d3.scale.linear().domain(season_extent).range(["#dddddd","#000000"])

	console.log(options.avg)

	if(options.avg) {
		avg.append("path")
			.attr("class","avg")
			.attr("d",line(options.avg.map(function(v,i){
				return {
					day:i,
					value:v
				}
			}).filter(function(v){
				return v.day>=options.min_x;
			})))	
	}
	

	seasons.append("path")
			.attr("class","bg")
			.attr("d",function(d){
				return line(d.value)
			});

	seasons.append("path")
			.attr("d",function(d){
				console.log("PAAAAATHHHH",d)
				return line(d.value)
			})

	var prev=null;
	var delta=options.align=="left"?-30:30;
	seasons.append("text")
			.attr("x",function(d){
				var x=xscale.range()[options.align=="left"?0:1];
				d.x=x;
				d.txt_x=x+delta;
				return x+delta;
			})
			.attr("dy","0.4em")
			.attr("y",function(d){
				var y = yscale(options.align=="left"?d.value[0].value:d.value[d.value.length-1].value);
				d.y=y;

				if(prev) {
					console.log(d.key,prev-10,"<"+y+"<",prev+10)
					
					if(options.invertedAxis) {
						if(y<prev+10) {
							//console.log("mod",d.key,y+10);
							y=prev+10;
						}	
					} else {
						if(y<prev+10) {
							//console.log("mod",d.key,y+10);
							y=prev+10;
						}
					}
				}
				prev=y;
				d.txt_y=y;

				return y;
			})
			.text(function(d){
				return d.key+"/"+(+d.key+1);
			})

	seasons
			.append("line")
				.attr("class","link")
				.classed("straight",function(d){
					return d.y==d.txt_y;
				})
				.attr("x1",function(d){
					var x=d.x;
					return x+2;
				})
				.attr("y1",function(d){
					return d.y;
				})
				.attr("x2",function(d){
					return d.txt_x-2;
				})
				.attr("y2",function(d){
					return d.txt_y;
				})

	if(!options.left) {
		seasons
				.filter(function(d){
					console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",d.value.length,xscale.domain()[1])
					return d.value.length!=xscale.domain()[1]+1;
				})
				.append("line")
					.attr("class","link")
					.classed("straight",1)
					.attr("x1",function(d){
						var x=d.x;

						//x-=(d.x-xscale(d.value.length-1))

						return x+2;
					})
					.attr("y1",function(d){
						return d.y;
					})
					.attr("x2",function(d){
						var x=d.x;

						x-=(d.x-xscale(d.value.length-1))

						return x+2;
					})
					.attr("y2",function(d){
						return d.y;
					})
	}
		

	var points=seasons.selectAll("g.point")
					.data(function(d){
						console.log("---------------->",d);
						return d.value.map(function(day){
							day.year=d.key;
							day.league_length=d.value.length-1;
							return day;
						})
					})
					.enter()
					.append("g")
						.attr("class","point")
						.classed("winner",function(d){
							//console.log("###############",d.day,options.distances[d.year]);
							//console.log("diff",options.distances[d.year][d.day][0]["diff"])
							console.log("()()()()()()()()()",d.year,d.league_length,options.league_length[d.year])
							if(d.league_length<options.league_length[d.year]) {
								return false;
							}


							if(options.distances[d.year][d.day][0]["diff"]>=(((options.distances[d.year].length-1) - d.day)*3)) {

								d.winner=true;

								return true;
							}
							//console.log("----------------->",d)
							return false;
						})
						.attr("transform",function(d,i){
							var x=xscale(d.day),
								y=yscale(d.value);
							//console.log(i,d,"=",y)
							return "translate("+x+","+(y)+")"
						})
	var winner=points
		.filter(function(d){
			return d.winner
		})
		.filter(function(d,i){
			return i===0;
		})
		.append("g")
			.attr("class","winner");

	
	

	winner.append("line")
			.attr("x1",0)
			.attr("x2",0)
			.attr("y1",0)
			.attr("y2",function(d){
				if(options.invertedAxis) {
					return yscale.range()[0] - yscale(d.value) + padding.bottom
				}
				return yscale(d.value)
			})

	winner.append("circle")
			.attr("cx",0)
			.attr("cy",0)
			.attr("r",4);

	winner.append("rect")
			.attr("x",-2)
			.attr("y",-2)
			.attr("width",4)
			.attr("height",4)


	points.append("circle")
			.attr("cx",0)
			.attr("cy",0)
			.attr("r",3)

	points.append("circle")
			.attr("class","bg")
			.attr("cx",0)
			.attr("cy",0)
			.attr("r",(xscale.range()[1]/xscale.domain()[1])/2)
			.on("mouseover",function(d,i){
				tooltip.update(xscale(d.day)+margins.left,yscale(d.value)+padding.top+margins.top,YEAR,i)
			})
			.on("mouseout",function(d,i){
				tooltip.hide();
			})

	var xAxis = d3.svg.axis()
					    .scale(xscale)
					    .orient("bottom")
					    .tickFormat(d3.format(",.0f"))
					    //.tickValues([1,2,3])
					    .ticks(xscale.domain()[1])

	var xaxis=grid.append("g")
			    .attr("class", "x axis")
			    .attr("transform", "translate(0," + (yscale.range()[0]+padding.bottom) + ")")

	xaxis.call(xAxis)

	var first_tick=xaxis.selectAll(".tick")
			.filter(function(d){
				return d===0
			})
			.select("text")
			.text("DAY")

	var yAxis = d3.svg.axis()
					    .scale(yscale)
					    .orient(options.align=="left"?"right":"left")
					    .tickFormat(d3.format(",.2f"));

	var yaxis=grid.append("g")
			    .attr("class", "y axis")
			    .attr("transform", function(){
			    	var x=0;
			    	if(options.align=="left") {
			    		x=xscale.range()[1]+padding.right;
			    	}
			    	return "translate("+x+"," + 0 + ")";	
			    })

	yaxis.call(yAxis)

	xaxis.selectAll(".tick")
		.filter(function(d,i){
			//console.log(i,xscale.domain()[1]/2)
			return i==xscale.domain()[1]/2;
		})
		.append("line")
		.attr("x1",0)
		.attr("x2",0)
		.attr("y1",0)
		.attr("y2",-yscale.range()[0]);



}

function Tooltip(options) {

	var container=d3.select(options.container+" .distance-chart div.chart");

	var tooltip=container.append("div")
			.attr("id","tooltip")

	var div=tooltip.append("div")

	var title=div.append("h2")
		.html("<span></span> Giornata")

	var ul=div.append("ol");

	var tm=null;

	this.hide=function() {
		tm=setTimeout(function(){
			tooltip.classed("hidden",true)
		},200)
	}
	this.update=function(x,y,YEAR,day) {

		if(tm) {
			clearTimeout(tm);
			tm=null;
		}

		console.log(x,y,YEAR,day)

		console.log(options.distances[YEAR][day])

		var teams=ul.selectAll("li")
			.data(function(){
				var li=[];
				options.distances[YEAR][day].forEach(function(d,i){
					if(i===0) {
						li.push({
							team:d.prev_team,
							points:d.prev
						})
					}
					li.push({
						team:d.team,
						points:d.p
					})
				});
				return li;
			})
		teams
			.enter()
			.append("li");

		teams
			.html(function(d){
				return "<span class=\"team\">"+d.team+"</span>"+"<span class=\"points\">"+d.points+"</span>";
			})

		var title=div.select("h2")
					.html("<span>"+day+"</span>&deg; Giornata")

		tooltip.style({
			top:(y-12)+"px",
			left:x+"px"
		})
		.classed("hidden",false)

		

	}

}