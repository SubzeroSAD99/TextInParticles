const canvas = document.querySelector("canvas")
const ctx = canvas.getContext('2d')
canvas.width = window.innerWidth
canvas.height = window.innerHeight

ctx.imageSmoothingEnabled = false


class Particle {
	constructor(effect, x, y, color) {
		this.effect = effect
		this.x = Math.random() * this.effect.ctx.canvas.width
		this.y = Math.random() * this.effect.ctx.canvas.height
		this.originX = x
		this.originY = y
		this.color = color
		this.size = this.effect.gap
		this.differenceX = 0
		this.differenceY = 0
		this.distance = 0
		this.speedX = 0
		this.speedY = 0
		this.force = 0
		this.angle = 0
		this.friction = Math.random() * 0.8 + 0.15
		this.ease = Math.random() * 0.1 + 0.005
	}

	draw() {
		this.effect.ctx.fillStyle = this.color
		this.effect.ctx.fillRect(this.x, this.y, this.size, this.size)
	}

	update() {
		this.differenceX = this.effect.mouseOrTouch.x - this.x
		this.differenceY = this.effect.mouseOrTouch.y - this.y

		this.distance = this.differenceX * this.differenceX + this.differenceY * this.differenceY // Para calcular a distancia entre esses dois pontos vou usar teorema de pitagoras
		this.force = -this.effect.mouseOrTouch.radius / this.distance

		if (this.distance < this.effect.mouseOrTouch.radius) {
			this.angle = Math.atan2(this.differenceY, this.differenceX) // Retorna o angulo em radianos entre o eixo X positivo e uma linha projetada do ponto 0,0 sim ele espera primeiro o Y depois o X
			this.speedX += this.force * Math.cos(this.angle) // Cosseno
			this.speedY += this.force * Math.sin(this.angle) // Seno
		}

		this.x += (this.speedX *= this.friction) + (this.originX - this.x) * this.ease
		this.y += (this.speedY *= this.friction) + (this.originY - this.y) * this.ease
	}
}


class Effect {
	constructor(context) {
		this.ctx = context
		this.textInput = document.querySelector("input")
		this.patternText = 'SubzeroSAD99'
		this.textX = ctx.canvas.width/2
		this.textY = ctx.canvas.height/2
		this.fontSize = 60
		this.lineHeight = this.fontSize * 1.2
		this.maxTextWidth = this.ctx.canvas.width * 0.8

		this.textInput.addEventListener("input", (event) => {
			if (!this.textInput.value.trim()) {
				this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
				this.wrapText(this.patternText)
			} else if (event.data !== " ") {
				this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
				this.wrapText(this.textInput.value.trim())
			}
		})

		this.particles = []
		this.gap = 2
		this.mouseOrTouch = {
			radius: 20000,
			x: 0,
			y: 0
		}

		window.addEventListener("touchmove",
			(e) => {
				this.mouseOrTouch.x = e.touches[0].clientX
				this.mouseOrTouch.y = e.touches[0].clientY
			})

		window.addEventListener("mousemove",
			(e) => {
				this.mouseOrTouch.x = e.x
				this.mouseOrTouch.y = e.y
			})

		window.addEventListener("touchend",
			(e) => {
				this.mouseOrTouch.x = 0
				this.mouseOrTouch.y = 0
			})
	}

	wrapText(text) {
		const gradient = this.ctx.createLinearGradient(0,
			0,
			this.ctx.canvas.width,
			this.ctx.canvas.height)
		gradient.addColorStop(0.4,
			"fuchsia")
		gradient.addColorStop(0.5,
			"red")
		gradient.addColorStop(0.6,
			"yellow")

		this.ctx.fillStyle = gradient
		this.ctx.lineWidth = 1.8
		this.ctx.strokeStyle = "white"
		this.ctx.textAlign = "center"
		this.ctx.textBaseline = "middle"
		this.ctx.font = `${this.fontSize}px Bangers`

		let linesArray = []
		let lineCounter = 0
		let line = ''
		let words = text.split(' ');

		words.forEach(word => {
			while (this.ctx.measureText(word).width > this.maxTextWidth) {
				let part = ''
				while (this.ctx.measureText(part + word[0]).width <= this.maxTextWidth && word.length > 0) {
					part += word[0]
					word = word.slice(1)
				}
				if (this.ctx.measureText(line + part).width > this.maxTextWidth) {
					linesArray.push(line)
					line = ''
				}
				line += part + ' '
			}

			let testLine = line + word + ' '
			if (this.ctx.measureText(testLine).width > this.maxTextWidth) {
				linesArray.push(line)
				line = word + ' '
			} else {
				line = testLine
			}
		})

		//Adicione a última linha, se houver
		if (line) {
			linesArray.push(line)
		}


		let textHeight = this.lineHeight * linesArray.length
		this.textY = this.ctx.canvas.height/2 - textHeight/2
		linesArray.forEach((lineArray, index) => {
			this.ctx.fillText(lineArray, this.textX, this.textY + (index * this.lineHeight))
			this.ctx.strokeText(lineArray, this.textX, this.textY + (index * this.lineHeight))
		})

		this.convertToParticles()

	}

	convertToParticles() {
		this.particles = []
		const pixels = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height).data // Retorna as cores dos pixels em cada pixel da tela... obs cada pixel é representado por quatro elementos... exemplo 0:255,1:255,2:255,3:222 nesse caso do 0 a 2 eh o codigo da cor e o 3 é a opacidade... que tambem é representado por um numero entre 0 e 255

		this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)

		for (let y = 0; y < this.ctx.canvas.height; y += this.gap) {
			// Percorre cada pixel da tela + valor do gap que no caso é 3... ou seja rle vai de 3 e.m 3 pixels
			for (let x = 0; x < this.ctx.canvas.width; x += this.gap) {
				const index = (y * this.ctx.canvas.width + x) * 4

				const alpha = pixels[index + 3]

				if (alpha) {
					const red = pixels[index]
					const green = pixels[index + 1]
					const blue = pixels[index + 2]
					const color = `rgb(${red}, ${green}, ${blue})`
					this.particles.push(new Particle(this, x, y, color))
				}
			}
		}
	}

	render() {
		this.particles.forEach(particle => {
			particle.update()
			particle.draw()
		})
	}

	resize() {
		this.textX = ctx.canvas.width/2
		this.textY = ctx.canvas.height/2
		this.maxTextWidth = this.ctx.canvas.width * 0.8
	}
}

window.addEventListener("resize", () => {
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
	effect.resize()
	effect.wrapText(effect.textInput.value.trim() || 'SubzeroSAD99')
})


const effect = new Effect(ctx)

document.fonts.ready.then(() => {
	effect.wrapText("SubzeroSAD99")
})

function animate() {
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	effect.render()
	requestAnimationFrame(animate)
}

animate()