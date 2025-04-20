import './App.css';
import '@mescius/wijmo.styles/wijmo.css';
import * as wjcGrid from '@mescius/wijmo.grid';
import { FlexGrid, FlexGridColumn, FlexGridColumnGroup, } from '@mescius/wijmo.react.grid';
import { TransposedGrid, TransposedGridRow } from '@mescius/wijmo.react.grid.transposed';
import { useEffect, useRef, useState } from 'react';
import * as wjcGridTransposed from '@mescius/wijmo.grid.transposed';
import './flexgrid.css';

type GridDisplayModel = {
  companyId: number;
  companyName: string;
  [key: string]: number | string;
};

type participatingCompanies = {
  companyId: number,
  companyName: string,
};


// 会社関連-------------------------------------------------------------

type CompanyHyokaKmk = {
  hyokaKmkId: number;
  hyokaKmkName: string;
};

type CompanyPointInfo = {
  hyokaKmkId: number;
  point?: number;
};

type Companies = {
  companyId: number,
  pointInfo?: CompanyPointInfo[];
};

type EvaluationCompany = {
  hyokaKmk?: CompanyHyokaKmk[],
  companies?: Companies[];
};

//---------技術者関連-------------------------------------------------------

type EngineerHyokaKmk = {
  hyokaKmkId: number;
  hyokaKmkName: string;
};

type EngineerPointInfo = {
  hyokaKmkId: number;
  point?: number;
};

type Engineers = {
  companyId: number,
  engineerId?: number,
  pointInfo?: EngineerPointInfo[];
};

type EvaluationEngineer = {
  hyokaKmk?: EngineerHyokaKmk[],
  engineers?: Engineers[];
};

//---------------------データ--------------------------------------------------------

const getEvaluationCompanyData: EvaluationCompany = {
  hyokaKmk: [
    { hyokaKmkId: 1, hyokaKmkName: '施工実績' },
    { hyokaKmkId: 2, hyokaKmkName: '騒音等' },
    { hyokaKmkId: 3, hyokaKmkName: '新規技術' },
  ],
  companies: [
    { companyId: 1, pointInfo: [{ hyokaKmkId: 1, point: 8 }, { hyokaKmkId: 2, point: 2 }, { hyokaKmkId: 3, point: 3 }] },
    { companyId: 2, pointInfo: [{ hyokaKmkId: 1, point: 4 }, { hyokaKmkId: 2, point: 5 }, { hyokaKmkId: 3, point: 6 }] },
    { companyId: 3, pointInfo: [{ hyokaKmkId: 1, point: 7 }, { hyokaKmkId: 2, point: 8 }, { hyokaKmkId: 3, point: 9 }] },
  ],
};

const getEvaluationEngineerData: EvaluationEngineer = {
  hyokaKmk: [
    { hyokaKmkId: 1, hyokaKmkName: '容姿' },
    { hyokaKmkId: 2, hyokaKmkName: '偏差値' },
    { hyokaKmkId: 3, hyokaKmkName: '性格' },
  ],
  engineers: [
    { companyId: 1, engineerId: 1, pointInfo: [{ hyokaKmkId: 1, point: 2 }, { hyokaKmkId: 2, point: 1 }, { hyokaKmkId: 3, point: 1 }] },
    { companyId: 1, engineerId: 2, pointInfo: [{ hyokaKmkId: 1, point: 1 }, { hyokaKmkId: 2, point: 11 }, { hyokaKmkId: 3, point: 10 }] },
    { companyId: 2, engineerId: 1, pointInfo: [{ hyokaKmkId: 1, point: 4 }, { hyokaKmkId: 2, point: 5 }, { hyokaKmkId: 3, point: 6 }] },
    { companyId: 3, engineerId: 1, pointInfo: [{ hyokaKmkId: 1, point: 7 }, { hyokaKmkId: 2, point: 8 }, { hyokaKmkId: 3, point: 9 }] },
  ],
};

const getParticipatingCompanies: participatingCompanies[] = [
  { companyId: 1, companyName: '自社' },
  { companyId: 2, companyName: '株式会社B' },
  { companyId: 3, companyName: '株式会社C' },
];

function App() {

  const [displayData, setDisplayData] = useState<GridDisplayModel[]>([]);
  const [evaluationCompany, setEvaluationCompany] = useState<EvaluationCompany>(getEvaluationCompanyData);
  const [evaluationEngineer, setEvaluationEngineer] = useState<EvaluationEngineer>(getEvaluationEngineerData);
  const [participatingCompanies, setParticipatingCompanies] = useState<participatingCompanies[]>(getParticipatingCompanies);
  const myCompanyId = 1;

  useEffect(() => {
    const mergedData: GridDisplayModel[] = participatingCompanies.map((company) => {
      const evalCompany = evaluationCompany.companies?.find(ec => ec.companyId === company.companyId);
      const engineers = evaluationEngineer.engineers?.filter(e => e.companyId === company.companyId) ?? [];

      // 会社の評価点
      const companyPoints: Record<string, number> = {};
      evaluationCompany.hyokaKmk?.forEach(kmk => {
        const info = evalCompany?.pointInfo?.find(p => p.hyokaKmkId === kmk.hyokaKmkId);
        if (info?.point !== undefined) {
          companyPoints[`company_${kmk.hyokaKmkId}`] = info.point;
        }
      });

      // 評価項目ごとに一番点数が低い技術者の点数を取得
      const engineerPoints: Record<string, number> = {};
      evaluationEngineer.hyokaKmk?.forEach(kmk => {
        let min = Infinity;
        let value: number | undefined = undefined;

        engineers.forEach(engineer => {
          const info = engineer.pointInfo?.find(p => p.hyokaKmkId === kmk.hyokaKmkId);
          if (info?.point != null && info.point < min) {
            min = info.point;
            value = info.point;
          }
        });

        if (value != null) {
          engineerPoints[`engineer_${kmk.hyokaKmkId}`] = value;
        }
      });

      return {
        companyId: company.companyId,
        companyName: company.companyName,
        ...companyPoints,
        ...engineerPoints,
      };
    });

    setDisplayData(mergedData);
  }, [evaluationCompany, evaluationEngineer, participatingCompanies]);


  // const initialized = (control: wjcGrid.FlexGrid) => {
  //   attachAutoEdit(control);
  //   control.columnHeaders.rows[0].height = 90;
  //   control.rowHeaders.columns[0].width = 90;
  // };

  // const formatItem = (control: wjcGrid.FlexGrid, e: wjcGrid.FormatItemEventArgs) => {
  //   if (e.panel == control.rowHeaders) {
  //     // 行ヘッダーのセルにname列の値を設定
  //     const rowData = control.itemsSource[e.row].name;
  //     e.cell.innerHTML = rowData;
  //   }
  // };

  //TransposedGrid関連
  const getRowGroupData = () => {
    const hasData = displayData && displayData.length > 0;

    const companyGroup = evaluationCompany.hyokaKmk?.map(kmk => ({
      binding: `company_${kmk.hyokaKmkId}`,
      header: kmk.hyokaKmkName,
    }));

    const engineerGroup = evaluationEngineer.hyokaKmk?.map(kmk => ({
      binding: `engineer_${kmk.hyokaKmkId}`,
      header: kmk.hyokaKmkName,
    }));

    return [
      {
        header: '企業の能力等',
        align: 'center',
        rows: hasData ? companyGroup : [],
      },
      {
        header: '技術者の能力等',
        align: 'center',
        rows: hasData ? engineerGroup : [],
      },
    ];
  };

  const transposedInitialized = (control: wjcGridTransposed.TransposedGrid) => {
    control.rowHeaders.columns[0].width = 20;
    attachAutoEdit(control);
  };

  const transposedFormatItem = (control: wjcGridTransposed.TransposedGrid, e: wjcGrid.FormatItemEventArgs) => {
    if (e.panel == control.columnHeaders) {
      // 列ヘッダーのセルにname列の値を設定
      const rowData = control.itemsSource[e.col].companyName;
      e.cell.innerHTML = rowData;
    }

  };

  const attachAutoEdit = (grid: wjcGrid.FlexGrid) => {
    grid.hostElement.addEventListener('mousedown', (e: MouseEvent) => {
      const ht = grid.hitTest(e);
      if (ht.cellType === wjcGrid.CellType.Cell) {
        setTimeout(() => grid.startEditing(true), 50);
      }
    });
  };

  return (
    <div>
      {/* <FlexGrid itemsSource={ } autoGenerateColumns={false} initialized={initialized} formatItem={formatItem} allowSorting={false}>
        <FlexGridColumn header="Country" binding="country" />
        <FlexGridColumn binding="age" header="Age" />
        <FlexGridColumn binding="gender" header="Gender" />
        <FlexGridColumn binding="children" header="Children" />
        <FlexGridColumn binding="pets" header="Pets" />
        <FlexGridColumn binding="income" header="Income" />
        <FlexGridColumn binding="spouse" header="Spouse" />
      </FlexGrid> */}

      <TransposedGrid
        itemsSource={displayData}
        autoGenerateRows={false}
        initialized={transposedInitialized}
        formatItem={transposedFormatItem}
        headersVisibility={wjcGrid.HeadersVisibility.All}
        selectionMode={wjcGrid.SelectionMode.Cell}
        rowGroups={getRowGroupData()}
      />
    </div >
  );
}

export default App;
