import './App.css';
import '@mescius/wijmo.styles/wijmo.css';
import * as wjcGrid from '@mescius/wijmo.grid';
import { TransposedGrid, TransposedGridRow } from '@mescius/wijmo.react.grid.transposed';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as wjcGridTransposed from '@mescius/wijmo.grid.transposed';
import './flexgrid.css';
import { EvaluationCompanyModel, GridDisplayModel, EvaluationPointModel, EvaluationEngineerModel, participatingCompaniesModel, CompanyHyokaKmkModel, CompaniesModel, EngineerHyokaKmkModel, EngineersModel, CompanyPointInfoModel, EngineerPointInfoModel, BidResultDisplayModel } from './type';
import { useRefState } from './hooks/useRefState';
import { FlexGrid, FlexGridColumn } from '@mescius/wijmo.react.grid';

type Props = {
  evaluationPoint: EvaluationPointModel;
  setEvaluationPoint: (evaluationPoint: EvaluationPointModel) => void;
  myCompanyId: number;
  participatingCompanies: participatingCompaniesModel[];
  isUpdateEngineer: boolean;
  setIsUpdateEngineer: (isUpdateEngineer: boolean) => void;
  bidResultDisplayData: BidResultDisplayModel[];
  setIsEvaluationPointInputSelf: (isEvaluationPointInputSelf: boolean) => void;
};



function EvaluationPoint(props: Props) {

  const [displayData, setDisplayData] = useState<GridDisplayModel[]>([]);
  const [evaluationCompany, setEvaluationCompany] = useRefState<EvaluationCompanyModel>(props.evaluationPoint?.EvaluationCompany);
  const [evaluationEngineer, setEvaluationEngineer] = useRefState<EvaluationEngineerModel>(props.evaluationPoint?.EvaluationEngineer);
  const [isImportMaster, setIsImportMaster] = useState(false);
  const [evaluationOldValue, setEvaluationOldValue] = useRefState(null);

  useEffect(() => {
    setEvaluationCompany(props.evaluationPoint?.EvaluationCompany);
    setEvaluationEngineer(props.evaluationPoint?.EvaluationEngineer);
    updateGridData();
  }, []);

  useEffect(() => {
    if (props.isUpdateEngineer) {

      setEvaluationEngineer(props.evaluationPoint?.EvaluationEngineer);
      updateGridData();
    }
    props.setIsUpdateEngineer(false);
  }, [props.isUpdateEngineer]);

  useEffect(() => {
    props.setEvaluationPoint({ EvaluationCompany: evaluationCompany.current, EvaluationEngineer: evaluationEngineer.current });
  }, [evaluationCompany.current, evaluationEngineer.current]);

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

    updateParticipationData();
    if (props.participatingCompanies && props.participatingCompanies.length > 0) {
      updateGridData();
    } else {
      setDisplayData([]);
    }
  }, [props.participatingCompanies]);

  useEffect(() => {
    if (isImportMaster) {
      updateGridData();
    }
    setIsImportMaster(false);
  }, [isImportMaster]);

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


  const actionOKOverwrapMaster = () => {

    const masterItem = {
      companyItems: [
        { id: 1, name: '施工実績' },
        { id: 2, name: '騒音等' },
        { id: 3, name: '新規技術' },
        { id: 4, name: '技術力' },
        { id: 5, name: '技術性' },
        { id: 6, name: '技術的性' },
        { id: 7, name: '技術的性' },
      ],
      engineerItems: [
        { id: 1, name: '容姿' },
        { id: 2, name: '偏差値' },
        { id: 3, name: '性格' },
        { id: 4, name: '技術力' },
        { id: 5, name: '技術性' },
        { id: 6, name: '技術的性' },
        { id: 7, name: '技術的性' },
      ]
    };
    //マスターから取得した項目を評価項目に設定 
    const companyListKmk: CompanyHyokaKmkModel[] = masterItem.companyItems.map((kmk) => {
      const item: CompanyHyokaKmkModel = {
        hyokaKmkId: kmk.id,
        hyokaKmkName: kmk.name,
      };

      return item;
    });

    // 企業にマスターから取り込んだ評価項目を設定 
    let companyPoint: CompaniesModel[] = [];
    if (evaluationCompany.current.companies && evaluationCompany.current.companies.length > 0) {
      companyPoint = evaluationCompany.current.companies.map(company => {
        const pointInfo: CompanyPointInfoModel[] = companyListKmk.map(kmk => ({
          hyokaKmkId: kmk.hyokaKmkId,
          point: undefined,
        }));

        return {
          companyId: company.companyId,
          pointInfo: pointInfo,
        };
      });
    }

    // 企業に自社が存在しない場合、新しい配列を作成して追加 
    if (!companyPoint.some(company => company.companyId === props.myCompanyId)) {
      const newCompanyPoint: CompaniesModel = {
        companyId: props.myCompanyId,
        pointInfo: companyListKmk.map(kmk => ({
          hyokaKmkId: kmk.hyokaKmkId,
          point: undefined,
        })),

      };

      companyPoint.unshift(newCompanyPoint);
    }



    const companyInfo: EvaluationCompanyModel = {
      hyokaKmk: companyListKmk,
      companies: companyPoint
    };

    setEvaluationCompany(companyInfo);


    // 技術者 
    const engineerListKmk: EngineerHyokaKmkModel[] = masterItem.engineerItems.map((kmk) => {
      const item: EngineerHyokaKmkModel = {
        hyokaKmkId: kmk.id,
        hyokaKmkName: kmk.name,
      };

      return item;
    });

    // 技術者にマスターから取り込んだ評価項目を設定
    let engineerPoint: EngineersModel[] = [];
    if (evaluationEngineer.current.engineers && evaluationEngineer.current.engineers.length > 0) {
      engineerPoint = evaluationEngineer.current.engineers.map(engineer => {
        const pointInfo: CompanyPointInfoModel[] = engineerListKmk.map(kmk => ({
          engineerId: engineer.engineerId,
          hyokaKmkId: kmk.hyokaKmkId,
          point: undefined,
        }));

        return {
          companyId: engineer.companyId,
          engineerId: engineer.engineerId,
          engineerName: engineer.engineerName,
          pointInfo: pointInfo,
        };
      });
    }

    const engineerInfo: EvaluationEngineerModel = {
      hyokaKmk: engineerListKmk,
      engineers: engineerPoint
    };

    setEvaluationEngineer(engineerInfo);
    setIsImportMaster(true);
  };



  //TransposedGrid関連
  const getRowGroupData = useMemo(() => {
    const companyGroup = evaluationCompany.current?.hyokaKmk?.map(kmk => ({
      binding: `company_${kmk.hyokaKmkId}`,
      header: kmk.hyokaKmkName,
      dataType: "Number",
      align: 'center',
      isRequired: false,
    }));

    const engineerGroup = evaluationEngineer.current?.hyokaKmk?.map(kmk => ({
      binding: `engineer_${kmk.hyokaKmkId}`,
      header: kmk.hyokaKmkName,
      dataType: "Number",
      align: 'center',
      isRequired: false
    }));

    const evaluationGroup = [];

    if (companyGroup?.length) {
      evaluationGroup.push({
        header: '企業の能力等',
        rows: companyGroup,
      });
    }

    if (engineerGroup?.length) {
      evaluationGroup.push({
        header: '技術者の能力等',
        rows: engineerGroup,
      });
    }

    return evaluationGroup;
  }, [
    evaluationCompany.current?.hyokaKmk,
    evaluationEngineer.current?.hyokaKmk
  ]);


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
      setTimeout(() => grid.startEditing(true), 50);
    });
  };

  const transposedBeginningEdit = (grid: wjcGridTransposed.TransposedGrid, e: wjcGrid.CellRangeEventArgs) => {
    if (!grid.itemsSource || e.col < 0 || e.col >= grid.itemsSource.length) {
      return; // 無効な col の場合は何もしない
    }

    const company = grid.itemsSource[e.col];
    if (company?.companyId === props.myCompanyId) {
      e.cancel = true;
    }
  };

  const transposedCellEditEnding = (control: wjcGridTransposed.TransposedGrid, e: wjcGrid.CellRangeEventArgs) => {
    setEvaluationOldValue(control.getCellData(e.row, e.col, false));
  };

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

    if (evaluationOldValue.current !== newValue) {
      props.setIsEvaluationPointInputSelf(true);
    }
  };

  const initializedFlexGrid = (control: wjcGrid.FlexGrid) => {
    attachAutoEdit(control);
    control.rowHeaders.columns[0].width = 100;
  };

  const formatItemFlexGrid = (control: wjcGrid.FlexGrid, e: wjcGrid.FormatItemEventArgs) => {
    if (e.panel == control.rowHeaders) {
      // 列ヘッダーのセルにname列の値を設定
      const rowData = control.itemsSource[e.row].companyName;
      e.cell.innerHTML = rowData;
    }
  };

  const cellEditEndedFlexGrid = (control: wjcGrid.FlexGrid, e: wjcGrid.CellRangeEventArgs) => {
    props.setIsEvaluationPointInputSelf(false);
  };

  return (
    <>
      <h2>入札結果</h2>
      <FlexGrid itemsSource={props.bidResultDisplayData} initialized={initializedFlexGrid} formatItem={formatItemFlexGrid} cellEditEnded={cellEditEndedFlexGrid} headersVisibility={wjcGrid.HeadersVisibility.All}>
        <FlexGridColumn header="企業の能力等" binding="companyAbility" isRequired={false} />
        <FlexGridColumn header="技術者の能力等" binding="engineerAbility" isRequired={false} />
      </FlexGrid>
      <h2>総合評価点</h2>
      <div>
        {(evaluationCompany.current?.hyokaKmk && evaluationCompany.current.hyokaKmk.length > 0 || evaluationEngineer.current?.hyokaKmk && evaluationEngineer.current.hyokaKmk.length > 0) && (
          <TransposedGrid
            className='transposedGrid'
            itemsSource={displayData}
            autoGenerateRows={false}
            initialized={transposedInitialized}
            formatItem={transposedFormatItem}
            headersVisibility={(evaluationCompany.current?.hyokaKmk?.length! > 0 || evaluationEngineer?.current?.hyokaKmk?.length! > 0) ? wjcGrid.HeadersVisibility.All : wjcGrid.HeadersVisibility.None}
            selectionMode={wjcGrid.SelectionMode.Cell}
            rowGroups={getRowGroupData}
            beginningEdit={transposedBeginningEdit}
            cellEditEnding={transposedCellEditEnding}
            cellEditEnded={transposedCellEditEnded}
            keyActionTab={wjcGrid.KeyAction.Cycle}
            keyActionEnter={wjcGrid.KeyAction.Cycle}
          />
        )}
      </div >

      <button onClick={() => actionOKOverwrapMaster()}>項目を設定</button>
    </>
  );
};

export default EvaluationPoint;
