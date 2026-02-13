import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnalyzeService } from '../../../core/services/analyze.service';
import { SidebarPurchaseComponent } from '../../../components/sidebar/sidebarPurchase.component';
import { Chart, registerables, ChartDataset, ChartConfiguration } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as XLSX from 'xlsx'
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';


@Component({
  selector: 'app-analyze',
  standalone: true,
  imports: [
    NgSelectModule,
    FormsModule,
    RouterOutlet,
    CommonModule,
    SidebarPurchaseComponent,

  ],
  templateUrl: './analyze.component.html',
  styleUrls: ['./analyze.component.scss']
})
export class AnalyzeComponent implements OnInit, AfterViewInit {

  public data: any[] = [];
  public loading: boolean = false;
  public error: string = '';
  public dataFromDB: any[] = [];

  // ตัวเลือก dropdown
  divisions = [
    { name: '7122' },
    { name: '71DZ' }
  ];

  selectedDivisions: string[] = []; // เก็บ division ที่เลือก
  chart: Chart | null = null;

  partNos: string[] = [];           // เก็บ list PartNo
  selectedPartNo: string = '';     // ค่า PartNo ที่เลือก (ค่าเดียว)


  itemNos: string[] = [];
  selectedItemNos: string[] = []; // เก็บ ItemNo ที่เลือก
  uniqueItemNos: string[] = [];   // เก็บ ItemNo ALL
  chartInstance: any;

  topN1: number = 10;
  topN: number = 10; // ค่าเริ่มต้น
  Divisions: string[] = [];
  Cases: string[] = [];
  Process: string[] = [];

  selectedDivision: string = 'ALL';
  selectedDivisionStacked: string = 'ALL';
  selectDatestart: string | null = null;
  selectDateend: string | null = null;
  selectedCase: string = 'ALL';
  uniqueCases: string[] = [];
  selectedCaseall: string = 'ALL';
  selectedprocess: string = 'ALL';
  uniqueprocess: string[] = [];
  selectedprocesshoz: string = 'ALL';

  public pieChart: Chart | null = null;
  public horizontalBarChart: Chart | null = null;
  public stackedBarChart: Chart | null = null; // ถ้ามี stacked bar

  constructor(
    private analyzeService: AnalyzeService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadData();
    }
  }

  loadData() {
    this.analyzeService.getdataall().subscribe({
      next: (response: any[]) => {
        this.data = response;
        this.uniqueItemNos = Array.from(new Set(this.data.map(d => d.ItemNo)));
        this.Cases = Array.from(new Set(this.data.map(c => c.CASE)));
        console.log(this.Cases);
        this.renderHorizontalBarChart();
        this.fetchAnalyzeData();
        this.dataFromDB = response;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  onItemNoChange() {
    this.renderHorizontalBarChart();
  }
  ngAfterViewInit(): void {
    // DOM พร้อมแล้ว เรียก API
    this.fetchAnalyzeData();
  }

  fetchAnalyzeData() {
    this.loading = true;
    this.analyzeService.getdataall().subscribe({
      next: (response: any[]) => {
        this.data = response;

        //  หาค่า Case ไม่ซ้ำ
        this.uniqueCases = Array.from(new Set(this.data.map(d => d.CASE)));

        this.uniqueprocess = Array.from(new Set(this.data.map(d => d.Process)));

        console.log('Cases:', this.uniqueCases);

        //  หาค่า Division ไม่ซ้ำ
        const divisionSet = new Set<string>();
        this.data.forEach(item => divisionSet.add(item.Division || 'อื่นๆ'));
        this.Divisions = Array.from(divisionSet);

        const caseSet = new Set<string>();
        this.data.forEach(item => caseSet.add(item.CASE || 'อื่นๆ'));
        this.Cases = Array.from(caseSet);

        const processSet = new Set<string>();
        this.data.forEach(item => processSet.add(item.Process || 'อื่นๆ'));
        this.Process = Array.from(processSet);

        // ค่า default dropdown
        if (!this.selectedDivision) this.selectedDivision = 'ALL';

        this.loading = false;

        // วาดกราฟ
        this.renderStatusChart();
        this.renderStackedBarChart();
        this.renderHorizontalBarChart();
      },
      error: (err) => {
        console.error(err);
        this.error = 'ไม่สามารถโหลดข้อมูลได้';
        this.loading = false;
      }
    });
  }






  renderStatusChart() {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = document.getElementById('dailySalesChart') as HTMLCanvasElement;
    if (!canvas || !this.data.length) return;

    const filteredData = this.selectedDivisions?.length
      ? this.data.filter(item => this.selectedDivisions.includes(item.Division))
      : this.data;

    const divisionStatusCounts: { [division: string]: { [status: string]: number } } = {};
    filteredData.forEach(item => {
      const division = item.Division;
      const status = item.Status;
      if (!divisionStatusCounts[division]) divisionStatusCounts[division] = {};
      divisionStatusCounts[division][status] = (divisionStatusCounts[division][status] || 0) + 1;
    });

    const labels = Array.from(new Set(filteredData.map(d => d.Status)));

    const divisionColors: { [division: string]: string } = {
      '7122': 'rgba(255, 99, 132, 0.6)',
      '71DZ': 'rgba(54, 162, 235, 0.6)'
    };

    const datasets = Object.keys(divisionStatusCounts).map(div => {
      const data = labels.map(status => divisionStatusCounts[div][status] || 0);
      return {
        label: div,
        data,
        backgroundColor: divisionColors[div] || 'rgba(200,200,200,0.6)',
        borderColor: '#fff',
        borderWidth: 1
      };
    });

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(canvas, {
      type: 'pie',
      data: { labels, datasets },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    this.initZoomPan();
  }
  @ViewChild('chartWrapper') chartWrapper!: ElementRef<HTMLDivElement>;
  private scale = 1;
  private translateX = 0;
  private translateY = 0;
  private isDragging = false;
  private startX = 0;
  private startY = 0;

  // ------------------ จำกัด transform ให้อยู่ในกรอบ ------------------
  private applyTransformchart() {
    const wrapper = this.chartWrapper.nativeElement;
    const canvas = wrapper.querySelector('canvas') as HTMLCanvasElement;

    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;

    const scaledWidth = canvas.offsetWidth * this.scale;
    const scaledHeight = canvas.offsetHeight * this.scale;

    const maxTranslateX = Math.max((scaledWidth - wrapperWidth) / 2, 0);
    const maxTranslateY = Math.max((scaledHeight - wrapperHeight) / 2, 0);

    this.translateX = Math.max(Math.min(this.translateX, maxTranslateX), -maxTranslateX);
    this.translateY = Math.max(Math.min(this.translateY, maxTranslateY), -maxTranslateY);

    wrapper.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  // ====== Zoom & Pan (สำหรับ Pie Chart) ======
  private initZoomPan() {
    const wrapper = this.chartWrapper.nativeElement;

    // Drag (Pan)
    wrapper.addEventListener('mousedown', e => {
      this.isDragging = true;
      this.startX = e.clientX - this.translateX;
      this.startY = e.clientY - this.translateY;
      wrapper.style.cursor = 'grabbing';
    });

    wrapper.addEventListener('mousemove', e => {
      if (!this.isDragging) return;
      this.translateX = e.clientX - this.startX;
      this.translateY = e.clientY - this.startY;
      this.applyTransformchart(); // ✅ จำกัดกรอบ
    });

    wrapper.addEventListener('mouseup', () => {
      this.isDragging = false;
      wrapper.style.cursor = 'grab';
    });

    wrapper.addEventListener('mouseleave', () => {
      this.isDragging = false;
      wrapper.style.cursor = 'grab';
    });

    // Zoom (wheel)
    // wrapper.addEventListener('wheel', e => {
    //   e.preventDefault();
    //   const delta = e.deltaY < 0 ? 0.1 : -0.1;
    //   this.scale = Math.min(Math.max(this.scale + delta, 0.5), 3);
    //   this.applyTransformchart();
    // });
  }

  // ====== Toolbar ======
  zoomIn1() {
    this.scale = Math.min(this.scale + 0.2, 3);
    this.applyTransformchart();
  }

  zoomOut1() {
    this.scale = Math.max(this.scale - 0.2, 0.5);
    this.applyTransformchart();
  }

  resetChart() {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.applyTransformchart();
  }

  // Export PNG
  exportStatusPNG() {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = this.chartWrapper.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'status-chart.png';
    link.click();
  }
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  selectedLevel: 'day' | 'month' | 'year' = 'day';

  setLevel(level: 'day' | 'month' | 'year') {
    this.selectedLevel = level;
    this.renderStackedBarChart();
  }

  renderStackedBarChart() {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = document.getElementById('stackedSalesChart') as HTMLCanvasElement;
    if (!canvas || !this.data?.length) return;

    const specs = Array.from(new Set(this.data.map(d => d.SPEC || 'อื่นๆ')));

    // กรองตาม Division
    let filteredData = this.selectedDivisionStacked === 'ALL'
      ? this.data
      : this.data.filter(d => d.Division === this.selectedDivisionStacked);

    // กรองตามช่วงวันที่จาก input
    if (this.selectDatestart) {
      const startDate = new Date(this.selectDatestart);
      filteredData = filteredData.filter(item => new Date(item.DateComplete) >= startDate);
    }
    if (this.selectDateend) {
      const endDate = new Date(this.selectDateend);
      filteredData = filteredData.filter(item => new Date(item.DateComplete) <= endDate);
    }

    if (this.selectedCaseall && this.selectedCaseall !== 'ALL') {
      filteredData = filteredData.filter(
        item => (item.CASE ?? '').toString().trim() === this.selectedCaseall.toString().trim()
      );
    }
    if (this.selectedprocess && this.selectedprocess !== 'ALL') {
      filteredData = filteredData.filter(
        item => (item.Process ?? '').toString().trim() === this.selectedprocess.toString().trim()
      );
    }

    // Group ข้อมูลตาม level
    const groupedData = filteredData.reduce((acc, item) => {
      const dateObj = new Date(item.DateComplete);
      let key = '';
      if (this.selectedLevel === 'day') key = dateObj.toISOString().split('T')[0];
      else if (this.selectedLevel === 'month') key = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      else key = `${dateObj.getFullYear()}`;
      const qty = Number(item.QTY) || 0;
      acc[key] = (acc[key] || 0) + qty;
      return acc;
    }, {} as { [key: string]: number });

    const topKeys = (Object.entries(groupedData) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.topN1)
      .map(e => e[0]);

    const dates = topKeys.map(k => {
      if (this.selectedLevel === 'day') return { key: k, obj: new Date(k) };
      if (this.selectedLevel === 'month') return { key: k, obj: new Date(k + '-01') };
      return { key: k, obj: new Date(k + '-01-01') };
    }).sort((a, b) => a.obj.getTime() - b.obj.getTime());

    const labels = dates.map(d => {
      const dateObj = d.obj;
      if (this.selectedLevel === 'day') return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
      if (this.selectedLevel === 'month') return `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
      return `${dateObj.getFullYear()}`;
    });

    // สร้าง datasets เริ่มต้น
    const datasetsUnsorted = specs.map(spec => ({
      label: spec,
      data: dates.map(d => {
        const sum = filteredData
          .filter(item => (item.SPEC || 'อื่นๆ') === spec)
          .filter(item => {
            const dateObj = new Date(item.DateComplete);
            if (this.selectedLevel === 'day') return dateObj.toISOString().split('T')[0] === d.key;
            if (this.selectedLevel === 'month') return `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}` === d.key;
            return `${dateObj.getFullYear()}` === d.key;
          })
          .reduce((sum, item) => sum + ((Number(item.QTY) || 0) * (Number(item.UnitPrice_Bath) || 0)), 0);
        return sum;
      }),
      backgroundColor: `hsl(${Math.floor(Math.random() * 360)},60%,70%)`,
      borderColor: '#fff',
      borderWidth: 1
    }));

    // เรียง datasets สำหรับแต่ละ label จากมาก -> น้อย
    const datasetsSorted: any[] = [];

    dates.forEach((d, idx) => {
      // เก็บค่าเงินแต่ละ spec สำหรับวันนั้น
      const valueArr = datasetsUnsorted
        .map((ds, dsIdx) => ({ value: ds.data[idx], dsIdx }))
        // .filter(v => v.value > 0)   //  ลบค่า 0
        .sort((a, b) => b.value - a.value); // มาก->น้อย

      valueArr.forEach((v, orderIdx) => {
        if (!datasetsSorted[orderIdx]) {
          datasetsSorted[orderIdx] = {
            label: datasetsUnsorted[v.dsIdx].label,
            data: Array(dates.length).fill(null),
            backgroundColor: datasetsUnsorted[v.dsIdx].backgroundColor,
            borderColor: '#fff',
            borderWidth: 1
          };
        }
        datasetsSorted[orderIdx].data[idx] = v.value;
      });
    });

    // ลบ chart เก่า
    if (this.stackedBarChart) this.stackedBarChart.destroy();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.stackedBarChart = new Chart(ctx!, {
      type: 'bar',
      data: { labels, datasets: datasetsSorted },
      options: {
        indexAxis: 'x',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          //  legend:{
          //   position:'right',
          //   align:'start',
          //   labels:{
          //     boxWidth:0,
          //     boxHeight:20,
          //     padding:15,
          //     usePointStyle:true,
          //     pointStyle:'rectRounded',
          //     font:{size:10}
          //   }
          // },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number | null;
                if (!value) return ''; // ไม่แสดง tooltip สำหรับค่า null หรือ 0

                const spec = context.dataset.label;
                return `${spec}: ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Baht`;
              },
              footer: (tooltipItems) => {
                const context = tooltipItems[0];
                const value = context.raw as number | null;
                if (!value) return ''; //  ไม่แสดงถ้าค่า null หรือ 0

                const spec = context.dataset.label;
                const dateKey = dates[context.dataIndex].key;
                const matchingItems = filteredData.filter(item => {
                  const itemSpec = item.SPEC || 'อื่นๆ';
                  const dateObj = new Date(item.DateComplete);
                  let itemKey = '';
                  if (this.selectedLevel === 'day') itemKey = dateObj.toISOString().split('T')[0];
                  else if (this.selectedLevel === 'month') itemKey = `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
                  else itemKey = `${dateObj.getFullYear()}`;

                  return itemSpec === spec && itemKey === dateKey
                    && (Number(item.QTY) || 0) * (Number(item.UnitPrice_Bath) || 0) > 0;
                });

                const partNos = matchingItems.map(i => i.PartNo).join(', ');
                return partNos ? `PartNo: ${partNos}` : '';
              }
            }
          },
          datalabels: {
            color: '#000',
            font: { size: 14 },
            anchor: 'center',
            align: 'center',
            formatter: (value, ctx) => {
              const datasetLabel = ctx.dataset.label;

              if (ctx.datasetIndex === ctx.chart.data.datasets.length - 1) {
                const total = ctx.chart.data.datasets.reduce((sum, ds) => {
                  const v = (ds.data as number[])[ctx.dataIndex];
                  return sum + (typeof v === 'number' ? v : 0);
                }, 0);
                return total !== 0 ? total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
              }
              // ถ้า dataset เป็น spec → แสดงชื่อ spec ในแท่งสีของตัวเอง (value > 4000)
              if (value > 4000) return datasetLabel;

              return ''; // ค่าเล็กกว่า 4000 → ไม่แสดงชื่อ
            }
          }
        },
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
      },
      plugins: [ChartDataLabels]
    });
    this.initZoomPanStacked()
  }
  // renderStackedBarChart() {

  @ViewChild('stackedWrapper') stackedWrapper!: ElementRef<HTMLDivElement>;

  private scaleS = 1;
  private translateXS = 0;
  private translateYS = 0;
  private isDraggingS = false;
  private startXS = 0;
  private startYS = 0;

  // ------------------ จำกัด transform ให้อยู่ในกรอบ ------------------
  private applyTransformStacked() {
    const wrapper = this.stackedWrapper.nativeElement;
    const canvas = wrapper.querySelector('canvas') as HTMLCanvasElement;

    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;

    const scaledWidth = canvas.offsetWidth * this.scaleS;
    const scaledHeight = canvas.offsetHeight * this.scaleS;

    const maxTranslateX = Math.max((scaledWidth - wrapperWidth) / 2, 0);
    const maxTranslateY = Math.max((scaledHeight - wrapperHeight) / 2, 0);

    this.translateXS = Math.max(Math.min(this.translateXS, maxTranslateX), -maxTranslateX);
    this.translateYS = Math.max(Math.min(this.translateYS, maxTranslateY), -maxTranslateY);

    wrapper.style.transform = `translate(${this.translateXS}px, ${this.translateYS}px) scale(${this.scaleS})`;
  }

  // ====== Zoom & Pan Init ======
  private initZoomPanStacked() {
    const wrapper = this.stackedWrapper.nativeElement;

    wrapper.addEventListener('mousedown', e => {
      this.isDraggingS = true;
      this.startXS = e.clientX - this.translateXS;
      this.startYS = e.clientY - this.translateYS;
      wrapper.style.cursor = 'grabbing';
    });

    wrapper.addEventListener('mousemove', e => {
      if (!this.isDraggingS) return;
      this.translateXS = e.clientX - this.startXS;
      this.translateYS = e.clientY - this.startYS;
      this.applyTransformStacked();
    });

    wrapper.addEventListener('mouseup', () => {
      this.isDraggingS = false;
      wrapper.style.cursor = 'grab';
    });

    wrapper.addEventListener('mouseleave', () => {
      this.isDraggingS = false;
      wrapper.style.cursor = 'grab';
    });

    // wrapper.addEventListener('wheel', e => {
    //   e.preventDefault();
    //   const delta = e.deltaY < 0 ? 0.1 : -0.1;
    //   this.scaleS = Math.min(Math.max(this.scaleS + delta, 0.5), 3);
    //   this.applyTransformStacked();
    // });
  }

  // ====== Toolbar ======
  zoomInStacked() {
    this.scaleS = Math.min(this.scaleS + 0.2, 3);
    this.applyTransformStacked();
  }

  zoomOutStacked() {
    this.scaleS = Math.max(this.scaleS - 0.2, 0.5);
    this.applyTransformStacked();
  }

  resetStackedChart() {
    this.scaleS = 1;
    this.translateXS = 0;
    this.translateYS = 0;
    this.applyTransformStacked();
  }

  // Export PNG
  exportStackedPNG() {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = this.stackedWrapper.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'stacked-sales-chart.png';
    link.click();
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////



  renderHorizontalBarChart() {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = document.getElementById('horizontalBarChart') as HTMLCanvasElement;
    if (!canvas || !this.data?.length) return;

    // ปรับโครงสร้างให้เก็บ PartNo ด้วย
    // { SPEC: { case1: { qty: number, partNos: string[] } } }
    const itemCaseMap: { [spec: string]: { [caseName: string]: { qty: number, partNos: string[] } } } = {};
    const itemDivisionMap: { [key: string]: string } = {};


    this.data.forEach(item => {
      const SPEC = item.SPEC;
      const qty = Number(item.QTY) || 0;
      const division = item.Division || 'อื่นๆ';
      const caseName = item.CASE || 'ไม่ระบุ';
      const process = item.Process || 'ไม่ระบุ';

      itemDivisionMap[SPEC] = division;

      //  เพิ่ม filter process
      const matchDivision = this.selectedDivision === 'ALL' || division === this.selectedDivision;
      const matchCase = this.selectedCase === 'ALL' || caseName === this.selectedCase;
      const matchProcess = this.selectedprocesshoz === 'ALL' || process === this.selectedprocesshoz;

      if (matchDivision && matchCase && matchProcess) {
        if (!itemCaseMap[SPEC]) itemCaseMap[SPEC] = {};
        if (!itemCaseMap[SPEC][caseName]) itemCaseMap[SPEC][caseName] = { qty: 0, partNos: [] };

        itemCaseMap[SPEC][caseName].qty += qty;
        itemCaseMap[SPEC][caseName].partNos.push(item.PartNo);
      }
    });

    // หารายการ top N ตาม qty รวม
    const topItems = Object.entries(itemCaseMap)
      .map(([spec, CASE]) => [spec, Object.values(CASE).reduce((a, b) => a + b.qty, 0)] as [string, number]) //  ใช้ .qty
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.topN);

    const topItemNos = topItems.map(e => e[0]);

    // list ของ case ที่มี
    const allCASE = Array.from(new Set(this.data.map(item => item.CASE || 'ไม่ระบุ')));

    // สีแยกตาม case
    function getPastelColors(count: number) {
      const colors: string[] = [];
      for (let i = 0; i < count; i++) {
        const hue = Math.floor(Math.random() * 360);
        const saturation = 60;
        const lightness = 70;
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
      }
      return colors;
    }
    const caseColors = getPastelColors(allCASE.length);

    //  สร้าง dataset ตาม case
    const datasets = allCASE.map((caseName, idx) => ({
      label: caseName,
      data: topItemNos.map(spec => itemCaseMap[spec]?.[caseName]?.qty || 0),
      backgroundColor: caseColors[idx],
      borderColor: "#fff",
      borderWidth: 1
    }));

    if (this.horizontalBarChart) this.horizontalBarChart.destroy();
    const ctx = canvas.getContext('2d');

    this.horizontalBarChart = new Chart(ctx!, {
      type: 'bar',
      data: { labels: topItemNos, datasets: datasets },
      options: {
        indexAxis: 'y',   // ✅ แกนสลับแนวนอน
        responsive: true,
        layout: {
          padding: {
            top: 10,
            right: 20,   // เว้นขอบขวา
            bottom: 5,  // เว้นขอบล่าง
            left: 20     // เว้นขอบซ้ายสำหรับ label Y
          }
        },

        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              generateLabels: (chart) => {
                return chart.data.datasets.map((ds, i) => {
                  const hidden = !chart.isDatasetVisible(i);
                  return {
                    text: ds.label as string,     // ✅ ชื่อ CASE
                    fillStyle: ds.backgroundColor as string,
                    strokeStyle: 'transparent',
                    hidden,
                    datasetIndex: i               // ต้องอ้าง datasetIndex ไม่ใช่ index
                  };
                });
              }
            },
            onClick: (e, legendItem, legend) => {
              const ci = legend.chart;
              ci.setDatasetVisibility(legendItem.datasetIndex!, !ci.isDatasetVisible(legendItem.datasetIndex!));
              ci.update();
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const value = context.raw as number;
                return `${context.dataset.label}: ${value} Piece`;
              },
              footer: function (contexts) {
                // contexts = array ของ point ที่ hover อยู่
                const ctx = contexts[0];
                const spec = ctx.label as string;
                const caseName = ctx.dataset.label as string;

                // ✅ ดึง PartNo
                const partNos = itemCaseMap[spec]?.[caseName]?.partNos || [];

                // ถ้าไม่มี PartNo ไม่ต้องโชว์
                return partNos.length ? `PartNo: ${partNos.join(", ")}` : '';
              }
            }
          },

          datalabels: {
            anchor: 'end',
            align: 'right',   // ✅ ชิดขวาแทน align: 'top'
            color: '#000',
            font: { weight: 'normal', size: 12 },
            formatter: (value, ctx) => {
              const chart = ctx.chart;
              const dataIndex = ctx.dataIndex;

              // หา dataset visible ตัวสุดท้าย
              const lastVisibleDatasetIndex = [...chart.data.datasets.keys()]
                .filter(i => chart.isDatasetVisible(i))
                .pop();

              if (ctx.datasetIndex === lastVisibleDatasetIndex) {
                const total = chart.data.datasets.reduce((sum, ds, i) => {
                  if (chart.isDatasetVisible(i)) {
                    const v = (ds.data as number[])[dataIndex];
                    return sum + (typeof v === 'number' ? v : 0);
                  }
                  return sum;
                }, 0);
                return total !== 0 ? total : '';
              }

              return '';
            }

          }
        },
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            ticks: { padding: 5 } // เว้นระยะจากแกน
          },
          y: {
            stacked: true,
            ticks: { padding: 5 } // เว้นระยะจากแกน
          }
        },
      },
      plugins: [ChartDataLabels]
    });
    this.initZoomPanHorizontal(); // เรียกใช้ zoom/pan
  }


  resetHorizontalBarChart() {
    // รีเซ็ต zoom/pan
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    if (this.horizontalWrapper) {
      this.horizontalWrapper.nativeElement.style.transform = '';
    }

    // รีเรนเดอร์ chart ใหม่โดยไม่ต้อง destroy ถ้า chart มีอยู่
    if (this.horizontalBarChart) {
      this.horizontalBarChart.update();
    } else {
      this.renderHorizontalBarChart();
    }
  }

  @ViewChild('horizontalWrapper') horizontalWrapper!: ElementRef<HTMLDivElement>;

  private scaleH = 1;
  private translateXH = 0;
  private translateYH = 0;
  private isDraggingH = false;
  private startXH = 0;
  private startYH = 0;

  // ------------------ จำกัด transform ให้อยู่ในกรอบ ------------------
  private applyTransform() {
    const wrapper = this.horizontalWrapper.nativeElement;
    const canvas = wrapper.querySelector('canvas') as HTMLCanvasElement;

    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;

    // ใช้ offsetWidth/Height ของ canvas จริง
    const scaledWidth = canvas.offsetWidth * this.scaleH;
    const scaledHeight = canvas.offsetHeight * this.scaleH;

    // ขอบเขตลาก
    const maxTranslateX = Math.max((scaledWidth - wrapperWidth) / 2, 0);
    const maxTranslateY = Math.max((scaledHeight - wrapperHeight) / 2, 0);

    this.translateXH = Math.max(Math.min(this.translateXH, maxTranslateX), -maxTranslateX);
    this.translateYH = Math.max(Math.min(this.translateYH, maxTranslateY), -maxTranslateY);

    canvas.style.transform = `translate(${this.translateXH}px, ${this.translateYH}px) scale(${this.scaleH})`;
  }

  // ------------------ ปรับ zoom/pan ให้ลากอยู่ในกรอบ ------------------
  private initZoomPanHorizontal() {
    const canvas = this.horizontalWrapper.nativeElement.querySelector('canvas') as HTMLCanvasElement;

    canvas.addEventListener('mousedown', e => {
      this.isDraggingH = true;
      this.startXH = e.clientX - this.translateXH;
      this.startYH = e.clientY - this.translateYH;
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', e => {
      if (!this.isDraggingH) return;

      this.translateXH = e.clientX - this.startXH;
      this.translateYH = e.clientY - this.startYH;

      this.applyTransform(); // ✅ จำกัดกรอบ
    });

    canvas.addEventListener('mouseup', () => {
      this.isDraggingH = false;
      canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
      this.isDraggingH = false;
      canvas.style.cursor = 'grab';
    });

    // ปิด wheel zoom เดิม
    canvas.addEventListener('wheel', e => e.preventDefault());
  }

  // ------------------ ปุ่ม Zoom ------------------
  zoomIn() {
    this.scaleH = Math.min(this.scaleH + 0.2, 3);
    this.applyTransform();
  }

  zoomOut() {
    this.scaleH = Math.max(this.scaleH - 0.2, 0.5);
    this.applyTransform();
  }

  resetZoom() {
    this.scaleH = 1;
    this.translateXH = 0;
    this.translateYH = 0;
    this.applyTransform();
  }

  // ------------------ Export PNG ------------------
  exportHorizontalBarPNG() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.horizontalBarChart) return;
    const canvas = this.horizontalWrapper.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = 'horizontal-bar-chart.png';
    link.click();
  }


  //         formatter: (value, ctx) => {
  //   if (ctx.datasetIndex === ctx.chart.data.datasets.length - 1) {
  //     const chart = ctx.chart;
  //     const total = chart.data.datasets.reduce((sum, ds, i) => {
  //       if (chart.isDatasetVisible(i)) {
  //         const v = (ds.data as number[])[ctx.dataIndex];
  //         return sum + (typeof v === 'number' ? v : 0);
  //       }
  //       return sum;
  //     }, 0);
  //     return total !== 0 ? total : '';
  //   }
  //   return '';
  // }

  fileName = 'Report.xlsx';

  exportexcel() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.dataFromDB || this.dataFromDB.length === 0) {
      alert("ไม่มีข้อมูลจาก Database");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // --- ใส่ header ---
    const headers = Object.keys(this.dataFromDB[0]);
    worksheet.addRow(headers);

    // --- ใส่ข้อมูล ---
    this.dataFromDB.forEach(row => {
      const rowData = headers.map(h => {
        const val = row[h];
        // Check if header implies a date or value looks like a date string
        // Common date fields: DateComplete, DateTime_Record, DueDate
        if ((h.includes('Date') || h.includes('Time')) && val) {
          // Try parsing
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            // Format as mm/dd/yyyy
            const day = d.getDate().toString().padStart(2, '0');
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const year = d.getFullYear();
            return `${month}/${day}/${year}`;
          }
        }
        return val;
      });
      worksheet.addRow(rowData);
    });

    // --- วาดกราฟจาก canvas ---
    const chartCanvas = document.getElementById('stackedSalesChart') as HTMLCanvasElement
      || document.getElementById('horizontalBarChart') as HTMLCanvasElement;

    if (!chartCanvas) {
      console.warn("ไม่พบ chart canvas");
      workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, this.fileName);
      });
      return;
    }

    html2canvas(chartCanvas).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const base64Data = imgData.split(',')[1];

      // ✨ Browser-safe: ใช้ Uint8Array แล้ว cast เป็น any
      const imgBuffer = new Uint8Array(atob(base64Data).split('').map(c => c.charCodeAt(0))) as any;

      const imageId = workbook.addImage({ buffer: imgBuffer, extension: 'png' });

      // วางรูปด้านล่างตาราง
      const lastRow = worksheet.lastRow?.number || this.dataFromDB.length + 2;
      worksheet.addImage(imageId, {
        tl: { col: 0, row: lastRow + 2 },
        ext: { width: 700, height: 400 }
      });

      workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, this.fileName);
      });
    });
  }
}
