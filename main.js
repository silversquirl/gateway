var mainIslandGateways = function() {
	var gateways = [];
	for (var i = 0; i < 20; i++) {
		var angle = 2 * (Math.PI/20 * i - Math.PI);
		gateways.push({
			x: Math.floor(96 * Math.cos(angle)),
			y: Math.floor(96 * Math.sin(angle)),
		});
	}
	return gateways;
}

function rayCast(x, y, length) {
	var mag = Math.hypot(x, y);
	var nx = x / mag;
	var ny = y / mag;
	return {x: nx*length, y: ny*length};
}

Vue.component("gateway-canvas", {
	props: {
		gateways: Array,
		selectedGateways: Array,
	},
	data: function() {
		return {
			ctx: null,
			style: {
				gateway: {
					normal: {colour: "green", radius: 5},
					selected: {colour: "blue", radius: 5},
				},
				gateray: {
					normal: {colour: "white"},
					selected: {colour: "cyan"},
				},
				ring: {
					inner: {colour: "lime", radius: 1024-256},
					centre: {colour: "red", radius: 1024},
					outer: {colour: "yellow", radius: 1024+256+16},
				},
			},
		};
	},

	mounted: function() {
		this.ctx = this.$refs.canvas.getContext("2d");
		this.redraw();
	},

	watch: {
		gateways: function() { this.redraw(); },
		selectedGateways: function() { this.redraw(); },
	},

	methods: {
		drawGateway: function(x, y, style) {
			this.ctx.beginPath();
			this.ctx.arc(x, y, style.radius, 0, 2*Math.PI);
			this.ctx.fillStyle = style.colour;
			this.ctx.fill();
		},

		drawGateRay: function(x, y, style) {
			var ray = rayCast(x, y, 1024);

			this.ctx.beginPath();
			this.ctx.moveTo(0, 0);
			this.ctx.lineTo(ray.x, ray.y);
			this.ctx.strokeStyle = style.colour;
			this.ctx.stroke();
		},

		drawRing: function(style) {
			this.ctx.beginPath();
			this.ctx.arc(0, 0, style.radius, 0, 2*Math.PI);
			this.ctx.strokeStyle = style.colour;
			this.ctx.stroke();
		},

		redraw: function() {
			this.$refs.canvas.width = this.$refs.canvas.clientWidth;
			this.$refs.canvas.height = this.$refs.canvas.clientHeight;

			// The radius of the circle that must fit within the canvas
			var requiredRadius = this.style.ring.outer.radius + 256;
			// The scale factor required to make that circle fit
			var scaleFactor = Math.min(this.$refs.canvas.width, this.$refs.canvas.height) / (2*requiredRadius);

			this.ctx.setTransform({
				// hscale
				a: scaleFactor,
				// vscale
				d: scaleFactor,
				// htranslate
				e: this.$refs.canvas.width/2,
				// vtranslate
				f: this.$refs.canvas.height/2,
				// hskew, vskew
				b: 0, c: 0,
			});

			this.ctx.clearRect(-requiredRadius, -requiredRadius, requiredRadius, requiredRadius);

			this.ctx.fillStyle = "black";
			//this.ctx.fillRect(-requiredRadius, -requiredRadius, requiredRadius, requiredRadius);
			this.ctx.fillRect(-requiredRadius, -requiredRadius, 2*requiredRadius, 2*requiredRadius);

			for (gateway of this.gateways) {
				let style;
				if (this.selectedGateways.includes(gateway)) {
					wayStyle = this.style.gateway.selected;
					rayStyle = this.style.gateray.selected;
				} else {
					wayStyle = this.style.gateway.normal;
					rayStyle = this.style.gateray.normal;
				}
				this.drawGateway(gateway.x, gateway.y, wayStyle);
				this.drawGateRay(gateway.x, gateway.y, rayStyle);
			}

			this.drawRing(this.style.ring.inner);
			this.drawRing(this.style.ring.centre);
			this.drawRing(this.style.ring.outer);
		},
	},

	template: "<canvas ref='canvas' class='gateway-canvas'></canvas>",
});

var app = new Vue({
	el: '#app',
	data: {
		gateways: mainIslandGateways(),
		editingGateway: {x: "", y: ""},
		selectedGateways: [],
		radius: {
			inner: 1024-256,
			centre: 1024,
			outer: 1024+256+16,
		}
	},

	methods: {
		addGateway: function() {
			this.gateways.push({
				x: this.editingGateway.x - 0,
				y: this.editingGateway.y - 0,
			});
		},

		delGateways: function() {
			// Mega inefficient O(n^2 * m) algorithm, but n and m are normally pretty small so who cares
			for (gateway of this.selectedGateways) {
				this.gateways.splice(this.gateways.indexOf(gateway), 1);
			}
		},

		intersect: function(gateway, radius) {
			var ray = rayCast(gateway.x, gateway.y, radius);
			return "(" + Math.trunc(ray.x) + ", " + Math.trunc(ray.y) + ")";
		},
	},
});
