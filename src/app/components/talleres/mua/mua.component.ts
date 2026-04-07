import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';

interface ConceptCard {
  icon: string;
  title: string;
  description: string;
}

interface FormulaItem {
  label: string;
  formula: string;
  meaning: string;
}

interface ActivityStep {
  step: number;
  instruction: string;
  question: string;
}

@Component({
  selector: 'app-mua',
  templateUrl: './mua.component.html',
  styleUrls: ['./mua.component.css']
})
export class MuaComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('simCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graphCanvas', { static: false }) graphRef!: ElementRef<HTMLCanvasElement>;

  activeSection: string = 'teoria';
  expandedFormula: number = -1;

  // Simulator state
  simMode: 'aceleracion' | 'frenado' = 'aceleracion';
  v0: number = 0;
  acceleration: number = 3;
  isRunning: boolean = false;
  simTime: number = 0;
  currentVelocity: number = 0;
  currentPosition: number = 0;
  private animFrameId: number = 0;
  private lastTimestamp: number = 0;
  private graphPoints: { t: number; v: number }[] = [];
  private positionTrail: number[] = [];

  concepts: ConceptCard[] = [
    {
      icon: '🏎️',
      title: 'Aceleración constante',
      description: 'En el MUA, la aceleración permanece igual durante todo el movimiento. El objeto cambia su velocidad de forma uniforme: cada segundo gana (o pierde) la misma cantidad de velocidad.'
    },
    {
      icon: '📈',
      title: 'Velocidad variable',
      description: 'A diferencia del MRU (donde la velocidad es constante), en el MUA la velocidad cambia linealmente con el tiempo. La gráfica v(t) es una línea recta con pendiente igual a la aceleración.'
    },
    {
      icon: '📏',
      title: 'Desplazamiento creciente',
      description: 'La distancia recorrida en cada segundo es mayor que la del segundo anterior (si se acelera). La gráfica x(t) forma una parábola, no una línea recta.'
    },
    {
      icon: '🔄',
      title: 'Desaceleración',
      description: 'Cuando un objeto frena, también es MUA pero con aceleración negativa. Un auto que reduce su velocidad de 60 a 0 km/h experimenta desaceleración uniforme.'
    }
  ];

  formulas: FormulaItem[] = [
    {
      label: 'Velocidad final',
      formula: 'v = v₀ + a · t',
      meaning: 'La velocidad en cualquier instante es la velocidad inicial más el producto de la aceleración por el tiempo transcurrido.'
    },
    {
      label: 'Posición',
      formula: 'x = x₀ + v₀ · t + ½ · a · t²',
      meaning: 'La posición del objeto depende de su posición inicial, su velocidad inicial, y un término cuadrático que refleja la aceleración.'
    },
    {
      label: 'Velocidad sin tiempo',
      formula: 'v² = v₀² + 2 · a · Δx',
      meaning: 'Permite calcular la velocidad final conociendo la aceleración y el desplazamiento, sin necesidad de conocer el tiempo.'
    },
    {
      label: 'Desplazamiento promedio',
      formula: 'Δx = ½ · (v₀ + v) · t',
      meaning: 'El desplazamiento es igual al promedio de las velocidades inicial y final multiplicado por el tiempo.'
    },
    {
      label: 'Aceleración',
      formula: 'a = (v − v₀) / t',
      meaning: 'La aceleración es el cambio de velocidad dividido por el tiempo que tardó en producirse ese cambio.'
    }
  ];

  activities: ActivityStep[] = [
    {
      step: 1,
      instruction: 'Configura la velocidad inicial en 0 m/s y la aceleración en 2 m/s². Presiona "Iniciar" y observa cómo el auto parte del reposo y va aumentando su velocidad.',
      question: '¿Cuánto vale la velocidad del auto a los 5 segundos? Verifica tu cálculo con la fórmula v = v₀ + a·t.'
    },
    {
      step: 2,
      instruction: 'Ahora configura V₀ = 5 m/s y aceleración = 0 m/s². Observa el movimiento.',
      question: '¿Qué tipo de movimiento observas cuando la aceleración es cero? ¿Cómo se ve la gráfica v(t)?'
    },
    {
      step: 3,
      instruction: 'Configura V₀ = 10 m/s y aceleración = -2 m/s² (negativa). Observa qué le pasa al auto.',
      question: '¿Qué sucede con la velocidad del auto? ¿En qué momento se detiene? Calcula el tiempo usando v = v₀ + a·t cuando v = 0.'
    },
    {
      step: 4,
      instruction: 'Realiza tres pruebas con aceleraciones diferentes: a = 1, a = 3, a = 5 m/s² (V₀ = 0 en todas). Anota la posición a los 4 segundos en cada caso.',
      question: '¿Cómo afecta la magnitud de la aceleración al desplazamiento? Si duplicas la aceleración, ¿se duplica la posición?'
    },
    {
      step: 5,
      instruction: 'Fija la aceleración en 2 m/s² y prueba con V₀ = 0, V₀ = 5 y V₀ = 10 m/s. Compara las gráficas v(t) resultantes.',
      question: '¿Qué cambia en la gráfica: la pendiente o el punto de inicio? ¿Por qué?'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.stopSimulation();
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  goToEvaluacion(): void {
    this.router.navigate(['/talleres/mua/evaluacion']);
  }

  setSection(section: string): void {
    this.activeSection = section;
    if (section === 'simulador') {
      this.resetSimulation();
      setTimeout(() => this.drawInitialState(), 50);
    }
  }

  toggleFormula(index: number): void {
    this.expandedFormula = this.expandedFormula === index ? -1 : index;
  }

  setMode(mode: 'aceleracion' | 'frenado'): void {
    if (this.isRunning) return;
    this.simMode = mode;
    if (mode === 'frenado') {
      this.v0 = 20;
      this.acceleration = -4;
    } else {
      this.v0 = 0;
      this.acceleration = 3;
    }
    this.resetSimulation();
  }

  // ===== SIMULATOR =====
  startSimulation(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.animFrameId = requestAnimationFrame((ts) => this.animate(ts));
  }

  pauseSimulation(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  resetSimulation(): void {
    this.pauseSimulation();
    this.simTime = 0;
    this.currentVelocity = this.v0;
    this.currentPosition = 0;
    this.graphPoints = [];
    this.positionTrail = [];
    setTimeout(() => this.drawInitialState(), 20);
  }

  private animate(timestamp: number): void {
    if (!this.isRunning) return;

    const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
    this.lastTimestamp = timestamp;
    this.simTime += dt;

    this.currentVelocity = this.v0 + this.acceleration * this.simTime;
    this.currentPosition = this.v0 * this.simTime + 0.5 * this.acceleration * this.simTime * this.simTime;

    if (this.currentVelocity <= 0.05 && this.simMode === 'frenado') {
      this.currentVelocity = 0;
      this.pauseSimulation();
      return;
    }

    this.graphPoints.push({ t: this.simTime, v: this.currentVelocity });
    this.positionTrail.push(this.currentPosition);

    this.drawSimulation();
    this.drawGraph();

    if (this.simTime < 15) {
      this.animFrameId = requestAnimationFrame((ts) => this.animate(ts));
    } else {
      this.pauseSimulation();
    }
  }

  private drawInitialState(): void {
    this.drawSimulation();
    this.drawGraph();
  }

  private drawSimulation(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.fillStyle = '#0a1628';
    ctx.fillRect(0, 0, W, H);

    // Road
    const roadY = H * 0.65;
    ctx.fillStyle = '#1a2a44';
    ctx.fillRect(0, roadY - 2, W, 40);

    // Road markings
    ctx.setLineDash([20, 15]);
    ctx.strokeStyle = '#4fc3f750';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, roadY + 18);
    ctx.lineTo(W, roadY + 18);
    ctx.stroke();
    ctx.setLineDash([]);

    // Position markers
    ctx.fillStyle = '#4fc3f740';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    const maxX = Math.max(50, this.currentPosition + 20);
    for (let m = 0; m <= maxX; m += 10) {
      const px = 60 + (m / maxX) * (W - 100);
      if (px < W - 30) {
        ctx.fillRect(px, roadY + 32, 1, 8);
        ctx.fillText(m + 'm', px, roadY + 52);
      }
    }

    // Position trail dots
    ctx.fillStyle = '#4fc3f730';
    for (let i = 0; i < this.positionTrail.length; i += 3) {
      const px = 60 + (this.positionTrail[i] / maxX) * (W - 100);
      if (px < W - 30) {
        ctx.beginPath();
        ctx.arc(px, roadY + 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Car position
    const carX = 60 + (this.currentPosition / maxX) * (W - 100);
    const carW = 48;
    const carH = 24;

    // Car body shadow
    ctx.fillStyle = '#4fc3f720';
    ctx.beginPath();
    ctx.ellipse(carX, roadY + 2, carW * 0.6, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Car body
    const carGrad = ctx.createLinearGradient(carX - carW / 2, roadY - carH - 10, carX + carW / 2, roadY - 4);
    carGrad.addColorStop(0, '#29b6f6');
    carGrad.addColorStop(1, '#0277bd');
    ctx.fillStyle = carGrad;
    // body
    this.roundRect(ctx, carX - carW / 2, roadY - carH - 4, carW, carH, 5);
    ctx.fill();
    // cabin
    ctx.fillStyle = '#01579b';
    this.roundRect(ctx, carX - carW / 4, roadY - carH - 14, carW / 2, 12, 4);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.arc(carX - carW / 3, roadY - 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carX + carW / 3, roadY - 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.arc(carX - carW / 3, roadY - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(carX + carW / 3, roadY - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Velocity arrow
    if (this.currentVelocity > 0.1) {
      const arrowLen = Math.min(this.currentVelocity * 4, 100);
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(carX + carW / 2 + 8, roadY - carH / 2 - 4);
      ctx.lineTo(carX + carW / 2 + 8 + arrowLen, roadY - carH / 2 - 4);
      ctx.stroke();
      // arrowhead
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.moveTo(carX + carW / 2 + 8 + arrowLen, roadY - carH / 2 - 4);
      ctx.lineTo(carX + carW / 2 + arrowLen, roadY - carH / 2 - 10);
      ctx.lineTo(carX + carW / 2 + arrowLen, roadY - carH / 2 + 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#4fc3f7';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('v', carX + carW / 2 + arrowLen / 2, roadY - carH / 2 - 14);
    }

    // Acceleration arrow
    if (Math.abs(this.acceleration) > 0.1) {
      const isAcc = this.acceleration > 0;
      const accColor = isAcc ? '#4caf50' : '#f44336';
      const aArrowLen = Math.min(Math.abs(this.acceleration) * 6, 80);
      
      const startX = carX + (isAcc ? carW / 2 + 8 : -carW / 2 - 8);
      const endX = startX + (isAcc ? aArrowLen : -aArrowLen);
      const accY = roadY - carH / 2 + 10;

      ctx.strokeStyle = accColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, accY);
      ctx.lineTo(endX, accY);
      ctx.stroke();

      // arrowhead for acce
      ctx.fillStyle = accColor;
      ctx.beginPath();
      if (isAcc) {
        ctx.moveTo(endX, accY);
        ctx.lineTo(endX - 6, accY - 4);
        ctx.lineTo(endX - 6, accY + 4);
      } else {
        ctx.moveTo(endX, accY);
        ctx.lineTo(endX + 6, accY - 4);
        ctx.lineTo(endX + 6, accY + 4);
      }
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = accColor;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = isAcc ? 'left' : 'right';
      ctx.fillText('a', (startX + endX) / 2, accY - 8);
    }

    // Info overlay
    ctx.fillStyle = '#e0f7fa';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`t = ${this.simTime.toFixed(1)} s`, 16, 28);
    ctx.fillText(`x = ${this.currentPosition.toFixed(1)} m`, 16, 48);
    ctx.fillText(`v = ${this.currentVelocity.toFixed(1)} m/s`, 16, 68);
  }

  private drawGraph(): void {
    const canvas = this.graphRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;

    ctx.fillStyle = '#0d1b2a';
    ctx.fillRect(0, 0, W, H);

    const pad = { top: 30, right: 20, bottom: 35, left: 50 };
    const gW = W - pad.left - pad.right;
    const gH = H - pad.top - pad.bottom;

    // Title
    ctx.fillStyle = '#4fc3f7';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Gráfica v(t) — Velocidad vs Tiempo', W / 2, 18);

    // Axes
    ctx.strokeStyle = '#4fc3f750';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, pad.top + gH);
    ctx.lineTo(pad.left + gW, pad.top + gH);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#4fc3f780';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Tiempo (s)', pad.left + gW / 2, H - 5);
    ctx.save();
    ctx.translate(14, pad.top + gH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Velocidad (m/s)', 0, 0);
    ctx.restore();

    const maxT = Math.max(10, this.simTime + 1);
    const maxV = Math.max(15, this.currentVelocity + 5, this.v0 + 5);

    // Grid
    ctx.strokeStyle = '#ffffff08';
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (i / 5) * gH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + gW, y);
      ctx.stroke();

      ctx.fillStyle = '#4fc3f760';
      ctx.textAlign = 'right';
      ctx.fillText(((5 - i) / 5 * maxV).toFixed(0), pad.left - 6, y + 4);
    }

    for (let i = 0; i <= 5; i++) {
      const x = pad.left + (i / 5) * gW;
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, pad.top + gH);
      ctx.stroke();

      ctx.fillStyle = '#4fc3f760';
      ctx.textAlign = 'center';
      ctx.fillText((i / 5 * maxT).toFixed(0), x, pad.top + gH + 16);
    }

    // Plot line
    if (this.graphPoints.length > 1) {
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < this.graphPoints.length; i++) {
        const px = pad.left + (this.graphPoints[i].t / maxT) * gW;
        const py = pad.top + gH - (this.graphPoints[i].v / maxV) * gH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Glow
      ctx.strokeStyle = '#4fc3f730';
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (let i = 0; i < this.graphPoints.length; i++) {
        const px = pad.left + (this.graphPoints[i].t / maxT) * gW;
        const py = pad.top + gH - (this.graphPoints[i].v / maxV) * gH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Current dot
      const lastP = this.graphPoints[this.graphPoints.length - 1];
      const dotX = pad.left + (lastP.t / maxT) * gW;
      const dotY = pad.top + gH - (lastP.v / maxV) * gH;
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private stopSimulation(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}
