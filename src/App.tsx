import './App.css';
import '@mescius/wijmo.styles/wijmo.css';
import * as wjcGrid from '@mescius/wijmo.grid';
import { FlexGrid, FlexGridColumn, FlexGridColumnGroup, } from '@mescius/wijmo.react.grid';
import { TransposedGrid, TransposedGridRow } from '@mescius/wijmo.react.grid.transposed';
import { useEffect, useRef, useState } from 'react';
import * as wjcGridTransposed from '@mescius/wijmo.grid.transposed';
import './flexgrid.css';

const myCompanyId: number = 5000;

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
    { companyId: myCompanyId, pointInfo: [{ hyokaKmkId: 1, point: 8 }, { hyokaKmkId: 2, point: 2 }, { hyokaKmkId: 3, point: 3 }] },
  ],
};

const getEvaluationEngineerData: EvaluationEngineer = {
  hyokaKmk: [
    { hyokaKmkId: 1, hyokaKmkName: '容姿' },
    { hyokaKmkId: 2, hyokaKmkName: '偏差値' },
    { hyokaKmkId: 3, hyokaKmkName: '性格' },
  ],
  engineers: [
    { companyId: myCompanyId, engineerId: 1, pointInfo: [{ hyokaKmkId: 1, point: 2 }, { hyokaKmkId: 2, point: 1 }, { hyokaKmkId: 3, point: 1 }] },
    { companyId: myCompanyId, engineerId: 2, pointInfo: [{ hyokaKmkId: 1, point: 1 }, { hyokaKmkId: 2, point: 11 }, { hyokaKmkId: 3, point: 10 }] },
  ],
};


function App() {

  const [displayData, setDisplayData] = useState<GridDisplayModel[]>([]);
  const [evaluationCompany, setEvaluationCompany] = useState<EvaluationCompany>(getEvaluationCompanyData);
  const [evaluationEngineer, setEvaluationEngineer] = useState<EvaluationEngineer>(getEvaluationEngineerData);
  const [participatingCompanies, setParticipatingCompanies] = useState<participatingCompanies[]>([]);

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

  useEffect(() => {
    participatingCompanies.forEach((company) => {
      const companyId = company.companyId;

      // 自社だったらスキップ
      if (companyId === myCompanyId) return;

      // companyの評価が存在しなければ追加
      const hasCompanyEval = evaluationCompany.companies?.some(c => c.companyId === companyId);
      if (!hasCompanyEval) {
        setEvaluationCompany(prev => ({
          ...prev,
          companies: [
            ...(prev.companies ?? []),
            {
              companyId,
              pointInfo: (prev.hyokaKmk ?? []).map(kmk => ({
                hyokaKmkId: kmk.hyokaKmkId,
                point: undefined,
              })),
            },
          ],
        }));
      }

      // engineerの評価が存在しなければ追加（仮にengineerId: 1で最低1人追加）
      const hasEngineerEval = evaluationEngineer.engineers?.some(e => e.companyId === companyId);
      if (!hasEngineerEval) {
        setEvaluationEngineer(prev => ({
          ...prev,
          engineers: [
            ...(prev.engineers ?? []),
            {
              companyId,
              engineerId: 1,
              pointInfo: (prev.hyokaKmk ?? []).map(kmk => ({
                hyokaKmkId: kmk.hyokaKmkId,
                point: undefined,
              })),
            },
          ],
        }));
      }
    });
  }, [participatingCompanies, myCompanyId]); // ← 忘れずに依存配列に追加

  const addNewCompany = (newCompanyId: number, newCompanyName: string) => {
    setParticipatingCompanies(prevCompanies => [...prevCompanies, { companyId: newCompanyId, companyName: newCompanyName }]);
  };


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

  const transposedBeginningEdit = (grid: wjcGridTransposed.TransposedGrid, e: wjcGrid.CellRangeEventArgs) => {
    const company = grid.itemsSource[e.col];

    if (company?.companyId === myCompanyId) {
      e.cancel = true;
    }
  };

  return (
    <>
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
          beginningEdit={transposedBeginningEdit}
        />
      </div >
      <button onClick={() => addNewCompany(myCompanyId, '自社')}>自社を追加</button>
      <button onClick={() => addNewCompany(displayData.length + 1, `企業${displayData.length + 1}`)}>
        他社を追加
      </button>
      <button onClick={() => setParticipatingCompanies([])}>会社を削除</button>
    </>
  );
}

export default App;
