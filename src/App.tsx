import './App.css';
import '@mescius/wijmo.styles/wijmo.css';
import * as wjcGrid from '@mescius/wijmo.grid';
import { FlexGrid, FlexGridColumn, FlexGridColumnGroup, } from '@mescius/wijmo.react.grid';
import { TransposedGrid, TransposedGridRow } from '@mescius/wijmo.react.grid.transposed';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as wjcGridTransposed from '@mescius/wijmo.grid.transposed';
import './flexgrid.css';
import { DataType } from '@mescius/wijmo';

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

type EvaluationPoint = {
  EvaluationCompany: EvaluationCompany,
  EvaluationEngineer: EvaluationEngineer
}


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


function App() {

  const [displayData, setDisplayData] = useState<GridDisplayModel[]>([]);
  const [EvaluationPoint, setEvaluationPoint] = useState<EvaluationPoint>();
  const [evaluationCompany, setEvaluationCompany] = useState<EvaluationCompany>();
  const [evaluationEngineer, setEvaluationEngineer] = useState<EvaluationEngineer>();
  const [participatingCompanies, setParticipatingCompanies] = useState<participatingCompanies[]>([]);
  const [celleditEnded, setcelleditEnded] = useState(false)

  useEffect(() => {
    console.log("評価点に変更がありました");
      setEvaluationCompany(EvaluationPoint?.EvaluationCompany);
      setEvaluationEngineer(EvaluationPoint?.EvaluationEngineer);
  }, [EvaluationPoint])

  useEffect(() => {
    console.log("参加業者データ(participatingCompanies)", participatingCompanies);
    
    if (participatingCompanies && participatingCompanies.length > 0) {
      updateDisplayData();
      updateEvaluationData();
    } else {
      setDisplayData([]);
    }
  }, [participatingCompanies]);

  useEffect(() => {
    if (!EvaluationPoint || !evaluationCompany || !evaluationEngineer) return;
    updateDisplayData();

    const updatedPoint: EvaluationPoint = {
      ...EvaluationPoint,
      EvaluationCompany: evaluationCompany,
      EvaluationEngineer: evaluationEngineer,
    };
  
    setEvaluationPoint(updatedPoint);
  }, [evaluationCompany, evaluationEngineer]);

  useEffect(() => {
    console.log("表示用データ（displayData）", displayData);
  }, [displayData]);

  useEffect(() => {
    console.log("会社データ（evaluationCompany）", evaluationCompany);
  }, [evaluationCompany]);

  useEffect(() => {
    console.log("技術者データ（evaluationEngineer）", evaluationEngineer);
  }, [evaluationEngineer]);

  useEffect(() => {
    console.log("評価点データ（EvaluationPoint）", EvaluationPoint);
  }, [EvaluationPoint])
  

  const updateEvaluationData = () => {
    // 1. 他社の会社データを更新
    const updatedCompanies = participatingCompanies
      .filter(company => company.companyId !== myCompanyId)
      .map(company => {
        const existing = evaluationCompany?.companies?.find(c => c.companyId === company.companyId);
        return existing ?? {
          companyId: company.companyId,
          pointInfo: evaluationCompany?.hyokaKmk?.map(kmk => ({
            hyokaKmkId: kmk.hyokaKmkId,
            point: undefined
          })) ?? [],
        };
      });

    // 2. 他社技術者データを更新（1社に1人）
    const updatedEngineers = participatingCompanies
      .filter(company => company.companyId !== myCompanyId)
      .map(company => {
        const existing = evaluationEngineer?.engineers?.find(e => e.companyId === company.companyId);
        return existing ?? {
          companyId: company.companyId,
          engineerId: undefined,
          pointInfo: evaluationEngineer?.hyokaKmk?.map(kmk => ({
            hyokaKmkId: kmk.hyokaKmkId,
            point: undefined
          })) ?? [],
        };
      });

    // 3. 状態更新（自社 + 他社） ← prevから自社だけfilterして合わせる
    setEvaluationCompany(prev => ({
      ...prev,
      companies: [
        ...(prev?.companies?.filter(c => c.companyId === myCompanyId) ?? []),
        ...updatedCompanies,
      ],
    }));

    setEvaluationEngineer(prev => ({
      ...prev,
      engineers: [
        ...(prev?.engineers?.filter(e => e.companyId === myCompanyId) ?? []),
        ...updatedEngineers,
      ],
    }));
  };


  const updateDisplayData = () => {
    const mergedData: GridDisplayModel[] = participatingCompanies.map((company) => {
      const evalCompany = evaluationCompany?.companies?.find(ec => ec.companyId === company.companyId);
      const engineers = evaluationEngineer?.engineers?.filter(e => e.companyId === company.companyId) ?? [];

      // 会社の評価点
      const companyPoints: Record<string, number> = {};
      evaluationCompany?.hyokaKmk?.forEach(kmk => {
        const info = evalCompany?.pointInfo?.find(p => p.hyokaKmkId === kmk.hyokaKmkId);
        if (info?.point !== undefined) {
          companyPoints[`company_${kmk.hyokaKmkId}`] = info.point;
        }
      });

      // 評価項目ごとに一番点数が低い技術者の点数を取得
      const engineerPoints: Record<string, number> = {};
      evaluationEngineer?.hyokaKmk?.forEach(kmk => {
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
  };

  const addNewCompany = (newCompanyId: number, newCompanyName: string) => {
    setParticipatingCompanies(prevCompanies => [...prevCompanies, { companyId: newCompanyId, companyName: newCompanyName }]);
  };

  const addMyCompanyData = () => {
    const getEvaluationCompanyData: EvaluationCompany = {
      hyokaKmk: [
        { hyokaKmkId: 1, hyokaKmkName: '施工実績' },
        { hyokaKmkId: 2, hyokaKmkName: '騒音等' },
        { hyokaKmkId: 3, hyokaKmkName: '新規技術' },
      ],
      companies: [
        { companyId: myCompanyId, pointInfo: [{ hyokaKmkId: 1, point: undefined }, { hyokaKmkId: 2, point: undefined }, { hyokaKmkId: 3, point: undefined }] },
      ],
    };
    
    const getEvaluationEngineerData: EvaluationEngineer = {
      hyokaKmk: [
        { hyokaKmkId: 1, hyokaKmkName: '容姿' },
        { hyokaKmkId: 2, hyokaKmkName: '偏差値' },
        { hyokaKmkId: 3, hyokaKmkName: '性格' },
      ],
      engineers: [
        { companyId: myCompanyId, engineerId: 1, pointInfo: [{ hyokaKmkId: 1, point: undefined }, { hyokaKmkId: 2, point: undefined }, { hyokaKmkId: 3, point: undefined }] },
        { companyId: myCompanyId, engineerId: 2, pointInfo: [{ hyokaKmkId: 1, point: undefined }, { hyokaKmkId: 2, point: undefined }, { hyokaKmkId: 3, point: undefined }] },
      ],
    };

    const getEvaluationPoint: EvaluationPoint = {
      EvaluationCompany: getEvaluationCompanyData,
      EvaluationEngineer: getEvaluationEngineerData
    }
    setEvaluationPoint(getEvaluationPoint);
  }

  const addMyCompanyPointData = () => {
    setEvaluationPoint(prev => {
      if (!prev) return prev;
  
      // 自社の会社データにスコア追加
      const updatedCompanies = prev.EvaluationCompany.companies?.map(company => {
        if (company.companyId === myCompanyId) {
          const updatedPointInfo = company.pointInfo?.map(info => ({
            ...info,
            point: info.point ?? 5 // 未設定(undefined)だったら5点入れる、既にあれば変更しない
          }));
          return { ...company, pointInfo: updatedPointInfo };
        }
        return company;
      });
  
      // 自社の技術者データにもスコア追加
      const updatedEngineers = prev.EvaluationEngineer.engineers?.map(engineer => {
        if (engineer.companyId === myCompanyId) {
          const updatedPointInfo = engineer.pointInfo?.map(info => ({
            ...info,
            point: info.point ?? 3 // 仮に3点で初期化
          }));
          return { ...engineer, pointInfo: updatedPointInfo };
        }
        return engineer;
      });
  
      return {
        EvaluationCompany: {
          ...prev.EvaluationCompany,
          companies: updatedCompanies,
        },
        EvaluationEngineer: {
          ...prev.EvaluationEngineer,
          engineers: updatedEngineers,
        },
      };
    });
  };
  
  const addCompanyEngineer = () => {
    setEvaluationCompany(EvaluationPoint?.EvaluationCompany);
    setEvaluationEngineer(EvaluationPoint?.EvaluationEngineer)
  }

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

    const companyGroup = evaluationCompany?.hyokaKmk?.map(kmk => ({
      binding: `company_${kmk.hyokaKmkId}`,
      header: kmk.hyokaKmkName,
      dataType: "Number",
      align: 'center',
    }));

    const engineerGroup = evaluationEngineer?.hyokaKmk?.map(kmk => ({
      binding: `engineer_${kmk.hyokaKmkId}`,
      header: kmk.hyokaKmkName,
      dataType: "Number",
      align: 'center',
    }));

    const evaluationGroup = [];

    if (evaluationCompany?.hyokaKmk && evaluationCompany.hyokaKmk.length > 0) {
      evaluationGroup.push({
        header: '企業の能力等',
        rows: companyGroup,
      });
    }

    if (evaluationEngineer?.hyokaKmk && evaluationEngineer.hyokaKmk.length > 0) {
      evaluationGroup.push({
        header: '技術者の能力等',
        rows: engineerGroup,
      });
    }

    return evaluationGroup;
  };


  const transposedInitialized = (control: wjcGridTransposed.TransposedGrid) => {
    control.rowHeaders.columns[0].width = 20;
    attachAutoEdit(control);
  };

  const transposedFormatItem = (control: wjcGridTransposed.TransposedGrid, e: wjcGrid.FormatItemEventArgs) => {
    if (e.panel === control.cells) {
      const company = control.itemsSource[e.col];

      if (company?.companyId === myCompanyId) {
        e.cell.style.backgroundColor = '#f0f0f0'; // 明るめのグレー
        e.cell.style.color = '#474747';              // テキストも少し薄く
      }
    }

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

  const transposedSelectionChanging = (grid: wjcGridTransposed.TransposedGrid, e: wjcGrid.CellRangeEventArgs) => {
    if (!grid.itemsSource || e.col < 0 || e.col >= grid.itemsSource.length) {
      return; // 無効な col の場合は何もしない
    }

    const company = grid.itemsSource[e.col];
    if (company?.companyId === myCompanyId) {
      e.cancel = true;
    }
  };

  const transposedCellEditEnded = (grid: wjcGridTransposed.TransposedGrid, e: wjcGrid.CellRangeEventArgs) => {
    const editedCompany = grid.itemsSource[e.col];
    const editedRow = grid.rows[e.row];
  
    const binding = editedRow.binding; // 例: "company_1" or "engineer_2"
    const newValue = grid.getCellData(e.row, e.col, false);
  
    if (binding?.startsWith('company_')) {
      const hyokaKmkId = parseInt(binding.split('_')[1]);
  
      setEvaluationCompany(prev => {
        const updatedCompanies = (prev?.companies ?? []).map(company => {
          if (company.companyId === editedCompany.companyId) {
            const updatedPointInfo = (company.pointInfo ?? []).map(info =>
              info.hyokaKmkId === hyokaKmkId ? { ...info, point: newValue } : info
            );
            return { ...company, pointInfo: updatedPointInfo };
          }
          return company;
        });
  
        return { ...prev, companies: updatedCompanies };
      });
    }
  
    if (binding?.startsWith('engineer_')) {
      const hyokaKmkId = parseInt(binding.split('_')[1]);
  
      setEvaluationEngineer(prev => {
        const updatedEngineers = (prev?.engineers ?? []).map(engineer => {
          if (engineer.companyId === editedCompany.companyId) {
            const updatedPointInfo = (engineer.pointInfo ?? []).map(info =>
              info.hyokaKmkId === hyokaKmkId ? { ...info, point: newValue } : info
            );
            return { ...engineer, pointInfo: updatedPointInfo };
          }
          return engineer;
        });
  
        return { ...prev, engineers: updatedEngineers };
      });
    }
    setcelleditEnded(true);
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

        {(evaluationCompany?.hyokaKmk && evaluationCompany.hyokaKmk.length > 0 || evaluationEngineer?.hyokaKmk && evaluationEngineer.hyokaKmk.length > 0) && (
          <TransposedGrid
            itemsSource={displayData}
            autoGenerateRows={false}
            initialized={transposedInitialized}
            formatItem={transposedFormatItem}
            headersVisibility={wjcGrid.HeadersVisibility.All}
            selectionMode={wjcGrid.SelectionMode.Cell}
            rowGroups={getRowGroupData()}
            selectionChanging={transposedSelectionChanging}
            cellEditEnded={transposedCellEditEnded}
          />
        )}
      </div >
      <button onClick={() => addNewCompany(myCompanyId, '自社')}>自社を追加</button>
      <button onClick={() => addNewCompany(displayData.length + 1, `企業${displayData.length + 1}`)}>
        他社を追加
      </button>
      <button onClick={() => setParticipatingCompanies([])}>会社を削除</button>
      <button onClick={() => addMyCompanyData()}>自社に項目を設定</button>
      <button onClick={() => addMyCompanyPointData()}>自社に点数を設定</button>
      <button onClick={() => addCompanyEngineer()}>会社と技術者に追加</button>
    </>
  );
}

export default App;
