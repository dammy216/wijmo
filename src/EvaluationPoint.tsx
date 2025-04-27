import './App.css';
import '@mescius/wijmo.styles/wijmo.css';
import * as wjcGrid from '@mescius/wijmo.grid';
import { TransposedGrid, TransposedGridRow } from '@mescius/wijmo.react.grid.transposed';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as wjcGridTransposed from '@mescius/wijmo.grid.transposed';
import './flexgrid.css';
import { EvaluationCompanyModel, GridDisplayModel, EvaluationPointModel, EvaluationEngineerModel, participatingCompaniesModel, CompanyHyokaKmkModel, CompaniesModel, EngineerHyokaKmkModel, EngineersModel } from './type';
import { useRefState } from './hooks/useRefState';

type Props = {
  evaluationPoint: EvaluationPointModel;
  setEvaluationPoint: (evaluationPoint: EvaluationPointModel) => void;
  myCompanyId: number;
  participatingCompanies: participatingCompaniesModel[];
};

function EvaluationPoint(props: Props) {

  const [displayData, setDisplayData] = useState<GridDisplayModel[]>([]);
  const [evaluationCompany, setEvaluationCompany] = useRefState<EvaluationCompanyModel>(props.evaluationPoint?.EvaluationCompany);
  const [evaluationEngineer, setEvaluationEngineer] = useRefState<EvaluationEngineerModel>(props.evaluationPoint?.EvaluationEngineer);
  const [isImportMaster, setIsImportMaster] = useState(false);

  useEffect(() => {
    setEvaluationCompany(props.evaluationPoint?.EvaluationCompany);
    setEvaluationEngineer(props.evaluationPoint?.EvaluationEngineer);
    updateGridData();
  }, []);

  useEffect(() => {
    console.log("会社データ(evaluationCompany)", evaluationCompany.current);
  }, [evaluationCompany.current]);

  useEffect(() => {
    console.log("技術者データ(evaluationEngineer)", evaluationEngineer.current);

  }, [evaluationEngineer.current]);

  useEffect(() => {
    console.log("評価点(evaluationPoint)", props.evaluationPoint);
  }, [props.evaluationPoint]);

  useEffect(() => {
    console.log("参加業者データ(participatingCompanies)", props.participatingCompanies);

    if (props.participatingCompanies && props.participatingCompanies.length > 0) {
      updateGridData();
      updateParticipationData();
    } else {
      setDisplayData([]);
    }
  }, [props.participatingCompanies]);

  useEffect(() => {
    if (isImportMaster) {
      updateGridData();
    }
    setIsImportMaster(false);
  }, [isImportMaster])

  const updateParticipationData = () => {
    // --- Company 更新
    const hyokaKmkCompany: CompanyHyokaKmkModel[] = evaluationCompany.current?.hyokaKmk ?? [];

    const updatedCompanyPoint: CompaniesModel[] = props.participatingCompanies
      .filter(company => company.companyId !== props.myCompanyId)
      .map(company => {
        // 既存データ探す
        const existingCompany: CompaniesModel | undefined = evaluationCompany.current?.companies?.find(c => c.companyId === company.companyId);
        if (existingCompany) {
          return existingCompany; // あったらそのまま使う
        } else {
          return {
            companyId: company.companyId,
            pointInfo: evaluationCompany.current?.hyokaKmk?.map(kmk => ({
              hyokaKmkId: kmk.hyokaKmkId,
              point: undefined
            })) ?? [],
          };
        }
      });

    // 自社データは必ず残す
    const myCompany: CompaniesModel | undefined = evaluationCompany.current?.companies?.find(c => c.companyId === props.myCompanyId);
    if (myCompany) {
      updatedCompanyPoint.unshift(myCompany);
    }

    const updatedCompany: EvaluationCompanyModel = {
      hyokaKmk: hyokaKmkCompany,
      companies: updatedCompanyPoint,
    };

    setEvaluationCompany(updatedCompany);

    // --- Engineer 更新
    const hyokaKmkEngineer: EngineerHyokaKmkModel[] = evaluationEngineer.current?.hyokaKmk ?? [];

    const updatedEngineers: EngineersModel[] = props.participatingCompanies
      .filter(company => company.companyId !== props.myCompanyId)
      .map(company => {
        const existingEngineer: EngineersModel | undefined = evaluationEngineer.current?.engineers?.find(e => e.companyId === company.companyId);
        if (existingEngineer) {
          return existingEngineer;
        } else {
          return {
            companyId: company.companyId,
            engineerId: undefined,
            engineerName: undefined,
            pointInfo: evaluationEngineer.current?.hyokaKmk?.map(kmk => ({
              hyokaKmkId: kmk.hyokaKmkId,
              point: undefined
            })) ?? [],
          };
        }
      });

    const myEngineers: EngineersModel[] = evaluationEngineer.current?.engineers?.filter(e => e.companyId === props.myCompanyId) ?? [];

    if (myEngineers && myEngineers.length > 0) {
      updatedEngineers.unshift(...myEngineers);
    }

    const updatedEngineer: EvaluationEngineerModel = {
      hyokaKmk: hyokaKmkEngineer,
      engineers: updatedEngineers,
    };

    setEvaluationEngineer(updatedEngineer);
  };


  const updateGridData = () => {
    const mergedData: GridDisplayModel[] = props.participatingCompanies.map((company) => {

      const evalCompany = evaluationCompany.current?.companies?.find(ec => ec.companyId === company.companyId);

      // 会社の評価点
      const companyPoints: Record<string, number> = {};
      evaluationCompany.current?.hyokaKmk?.forEach(kmk => {
        const info = evalCompany?.pointInfo?.find(p => p.hyokaKmkId === kmk.hyokaKmkId);
        if (info?.point !== undefined) {
          companyPoints[`company_${kmk.hyokaKmkId}`] = info.point;
        }
      });

      const engineers = evaluationEngineer.current?.engineers?.filter(e => e.companyId === company.companyId) ?? [];

      // 評価項目ごとに一番点数が低い技術者の点数を取得
      const engineerPoints: Record<string, number> = {};
      evaluationEngineer.current?.hyokaKmk?.forEach(kmk => {
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


  const addMyCompanyData = () => {
    const getEvaluationCompanyData: EvaluationCompanyModel = {
      hyokaKmk: [
        { hyokaKmkId: 1, hyokaKmkName: '施工実績' },
        { hyokaKmkId: 2, hyokaKmkName: '騒音等' },
        { hyokaKmkId: 3, hyokaKmkName: '新規技術' },
      ],
      companies: [
        {
          companyId: props.myCompanyId,
          pointInfo: [
            { hyokaKmkId: 1, point: undefined },
            { hyokaKmkId: 2, point: undefined },
            { hyokaKmkId: 3, point: undefined }
          ]
        },
      ],
    };

    const getEvaluationEngineerData: EvaluationEngineerModel = {
      hyokaKmk: [
        { hyokaKmkId: 1, hyokaKmkName: '容姿' },
        { hyokaKmkId: 2, hyokaKmkName: '偏差値' },
        { hyokaKmkId: 3, hyokaKmkName: '性格' },
      ],
      engineers: [
        {
          companyId: props.myCompanyId,
          engineerId: 1,
          engineerName: "エンジニア1", // ★←これも必要なら追加
          pointInfo: [
            { hyokaKmkId: 1, point: undefined },
            { hyokaKmkId: 2, point: undefined },
            { hyokaKmkId: 3, point: undefined }
          ]
        },
        {
          companyId: props.myCompanyId,
          engineerId: 2,
          engineerName: "エンジニア2", // ★
          pointInfo: [
            { hyokaKmkId: 1, point: undefined },
            { hyokaKmkId: 2, point: undefined },
            { hyokaKmkId: 3, point: undefined }
          ]
        },
      ],
    };

    const getEvaluationPoint: EvaluationPointModel = {
      EvaluationCompany: getEvaluationCompanyData,
      EvaluationEngineer: getEvaluationEngineerData
    };

    setIsImportMaster(true);
    props.setEvaluationPoint(getEvaluationPoint);
    setEvaluationCompany(getEvaluationCompanyData);
    setEvaluationEngineer(getEvaluationEngineerData);
  };

  //TransposedGrid関連
  const getRowGroupData = () => {

    const companyGroup = evaluationCompany.current?.hyokaKmk?.map(kmk => ({
      binding: `company_${kmk.hyokaKmkId}`,
      header: kmk.hyokaKmkName,
      dataType: "Number",
      align: 'center',
    }));

    const engineerGroup = evaluationEngineer.current?.hyokaKmk?.map(kmk => ({
      binding: `engineer_${kmk.hyokaKmkId}`,
      header: kmk.hyokaKmkName,
      dataType: "Number",
      align: 'center',
    }));

    const evaluationGroup = [];

    if (evaluationCompany.current?.hyokaKmk && evaluationCompany.current.hyokaKmk.length > 0) {
      evaluationGroup.push({
        header: '企業の能力等',
        rows: companyGroup,
      });
    }

    if (evaluationEngineer.current?.hyokaKmk && evaluationEngineer.current.hyokaKmk.length > 0) {
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

      if (company?.companyId === props.myCompanyId) {
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
    if (company?.companyId === props.myCompanyId) {
      e.cancel = true;
    }
  };

  const lostFocus = () => {
    props.setEvaluationPoint({ EvaluationCompany: evaluationCompany.current, EvaluationEngineer: evaluationEngineer.current });
  }

  //これは各会社、エンジニアを更新する
  const transposedCellEditEnded = (control: wjcGridTransposed.TransposedGrid, e: wjcGrid.CellRangeEventArgs) => {
    const editedCompany: CompaniesModel = control.itemsSource[e.col];
    const editedRow = control.rows[e.row];
    const bindingValue = editedRow.binding;
    const newValue = control.getCellData(e.row, e.col, false);

    const companyHyokaKmk: CompanyHyokaKmkModel[] = evaluationCompany.current?.hyokaKmk ?? [];

    if (bindingValue?.startsWith('company_')) {
      const hyokaKmkId = Number(bindingValue.split('_')[1]);

      const updatedCompanyPoint: CompaniesModel[] = evaluationCompany.current?.companies?.map((company) => {
        if (company.companyId === editedCompany.companyId) {
          const companyPoint: CompaniesModel = {
            companyId: company.companyId,
            pointInfo: company.pointInfo?.map((point) => {
              if (point.hyokaKmkId === hyokaKmkId) {
                return { ...point, point: newValue };
              }
              return point;
            })
          };
          return companyPoint;
        } else {
          return company;
        }
      }) ?? [];

      const companyInfo: EvaluationCompanyModel = {
        hyokaKmk: companyHyokaKmk,
        companies: updatedCompanyPoint
      };

      setEvaluationCompany(companyInfo);
    }

    const hyokaKmkEngineer: EngineerHyokaKmkModel[] = evaluationEngineer.current?.hyokaKmk ?? [];

    if (bindingValue?.startsWith('engineer_')) {
      const hyokaKmkId = Number(bindingValue.split('_')[1]);

      const updatedEngineerPoint: EngineersModel[] = evaluationEngineer.current?.engineers?.map((engineer) => {
        if (engineer.companyId === editedCompany.companyId) {
          const engineerPoint: EngineersModel = {
            companyId: engineer.companyId,
            engineerId: engineer.engineerId,
            engineerName: engineer.engineerName,
            pointInfo: engineer.pointInfo?.map((point) => {
              if (point.hyokaKmkId === hyokaKmkId) {
                return { ...point, point: newValue };
              }
              return point;
            })
          };
          return engineerPoint;
        } else {
          return engineer;
        }
      }) ?? [];

      const engineerInfo: EvaluationEngineerModel = {
        hyokaKmk: hyokaKmkEngineer,
        engineers: updatedEngineerPoint
      };

      setEvaluationEngineer(engineerInfo);
    };
  };


  return (
    <>
      <h2>総合評価点</h2>
      <div>
        {(evaluationCompany.current?.hyokaKmk && evaluationCompany.current.hyokaKmk.length > 0 || evaluationEngineer.current?.hyokaKmk && evaluationEngineer.current.hyokaKmk.length > 0) && (
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
            lostFocus={lostFocus}
          />
        )}
      </div >

      <button onClick={() => addMyCompanyData()}>項目を設定</button>
    </>
  );
};

export default EvaluationPoint;
