import React, { useEffect, useRef, useState } from 'react';
import { FlexGrid, FlexGridColumn, FlexGridColumnGroup, } from '@mescius/wijmo.react.grid';
import * as wjcGrid from '@mescius/wijmo.grid';
import { CompaniesModel, CompanyHyokaKmkModel, CompanyPointInfoModel, EngineerHyokaKmkModel, EngineerPointInfoModel, EngineersModel, EvaluationCompanyModel, EvaluationEngineerModel, EvaluationPointModel, GridDisplayModel } from './type';
import { TransposedGrid, TransposedGridRow } from '@mescius/wijmo.react.grid.transposed';
import { useRefState } from './hooks/useRefState';

type Props = {
  evaluationPoint: EvaluationPointModel;
  setEvaluationPoint: (evaluationPoint: EvaluationPointModel) => void;
  myCompanyId: number;
  isUpdateEngineer: boolean;
  setIsUpdateEngineer: (isUpdateEngineer: boolean) => void;
};

type DisplayCompanyGridModel = {
  companyId: number;
  [key: number]: number;
};

type DisplayEngineerGridModel = {
  companyId: number;
  engineerId?: number;
  engineerName?: string;
  [key: number]: number | string | undefined;
};

const MyCompanyEvaluation = (props: Props) => {
  const [evaluationCompany, setEvaluationCompany] = useRefState<EvaluationCompanyModel>(props.evaluationPoint?.EvaluationCompany);
  const [evaluationEngineer, setEvaluationEngineer] = useRefState<EvaluationEngineerModel>(props.evaluationPoint?.EvaluationEngineer);

  const [displayCompanyGrid, setDisplayCompanyGridModel] = useState<DisplayCompanyGridModel[]>([]);
  const [displayEngineerGrid, setDisplayEngineerGrid] = useState<DisplayEngineerGridModel[]>([]);
  const [isImportMaster, setIsImportMaster] = useState(false);

  useEffect(() => {
    if (props.isUpdateEngineer) {
      setEvaluationEngineer(props.evaluationPoint?.EvaluationEngineer);
      updateGridEngineerData();
    }
    props.setIsUpdateEngineer(false);
  }, [props.isUpdateEngineer]);


  useEffect(() => {
    console.log("会社リスト", evaluationCompany.current);

  }, [evaluationCompany.current]);

  useEffect(() => {

    console.log("技術者リスト", evaluationEngineer.current);

  }, [evaluationEngineer.current]);


  useEffect(() => {
    setEvaluationCompany(props.evaluationPoint?.EvaluationCompany);
    setEvaluationEngineer(props.evaluationPoint?.EvaluationEngineer);
    updateGridCompanyData();
    updateGridEngineerData();
  }, []);

  useEffect(() => {
    if (isImportMaster) {
      updateGridCompanyData();
      updateGridEngineerData();
    }
    setIsImportMaster(false);
  }, [isImportMaster]);

  const updateGridCompanyData = () => {
    const companyData: DisplayCompanyGridModel[] = evaluationCompany.current?.companies
      ?.filter(company => company.companyId === props.myCompanyId)
      .map((company) => {

        const companyPoints: Record<string, number | undefined> = {};
        evaluationCompany.current?.hyokaKmk?.forEach(kmk => {
          const info = company?.pointInfo?.find(p => p.hyokaKmkId === kmk.hyokaKmkId);
          companyPoints[kmk.hyokaKmkId] = info?.point;
        });

        return {
          companyId: company.companyId,
          ...companyPoints,
        };
      }) ?? [];

    setDisplayCompanyGridModel(companyData);
  };

  const updateGridEngineerData = () => {
    const engineerData: DisplayEngineerGridModel[] = evaluationEngineer.current?.engineers
      ?.filter(engineer => engineer.companyId === props.myCompanyId)
      .map((engineer) => {

        const engineerPoints: Record<string, number | undefined> = {};
        evaluationEngineer.current?.hyokaKmk?.forEach(kmk => {
          const info = engineer?.pointInfo?.find(p => p.hyokaKmkId === kmk.hyokaKmkId);
          engineerPoints[kmk.hyokaKmkId] = info?.point;
        });
        return {
          companyId: engineer.companyId,
          engineerId: engineer.engineerId,
          engineerName: engineer.engineerName,
          ...engineerPoints,
        };
      }) ?? [];

    setDisplayEngineerGrid(engineerData);
  };

  const initializedCompany = (control: wjcGrid.FlexGrid) => {
    attachAutoEdit(control);

  };
  const initializedEngineer = (control: wjcGrid.FlexGrid) => {
    attachAutoEdit(control);

  };

  const formatItem = (control: wjcGrid.FlexGrid, e: wjcGrid.FormatItemEventArgs) => {
    control.rowHeaders.columns[0].width = 100;
    if (e.panel == control.columnHeaders) {
      // 行ヘッダーのセルにname列の値を設定
      const rowData = control.itemsSource[e.col].engineerName;
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

  const cellEditEndedCompany = (control: wjcGrid.FlexGrid, e: wjcGrid.CellRangeEventArgs) => {
    const editedRow = control.rows[e.row];
    const newValueRaw = control.getCellData(e.row, e.col, false);
    const newValue = newValueRaw === '' || newValueRaw == null ? undefined : Number(newValueRaw);
    const hyokaKmk: CompanyHyokaKmkModel[] = evaluationCompany.current?.hyokaKmk ?? [];

    const updatedCompanyPoint: CompaniesModel[] = evaluationCompany.current?.companies?.map((company) => {
      if (company.companyId === props.myCompanyId) {
        const companyPoint: CompaniesModel = {
          companyId: company.companyId,
          pointInfo: company.pointInfo?.map((point) => {
            if (point.hyokaKmkId === Number(editedRow.binding)) {
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
      hyokaKmk: hyokaKmk,
      companies: updatedCompanyPoint
    };

    setEvaluationCompany(companyInfo);

  };

  const cellEditEndedEngineer = (control: wjcGrid.FlexGrid, e: wjcGrid.CellRangeEventArgs) => {
    const editedRow = control.rows[e.row];
    const newValue = control.getCellData(e.row, e.col, false);
    const hyokaKmk: EngineerHyokaKmkModel[] = evaluationEngineer.current?.hyokaKmk ?? [];

    const updatedEngineerPoint: EngineersModel[] = evaluationEngineer.current?.engineers?.map((engineer) => {
      if (engineer.companyId === props.myCompanyId && engineer.engineerId === control.itemsSource[e.col].engineerId) {
        const engineerPoint: EngineersModel = {
          companyId: engineer.companyId,
          engineerId: engineer.engineerId,
          engineerName: engineer.engineerName,
          pointInfo: engineer.pointInfo?.map((point) => {
            if (point.hyokaKmkId === Number(editedRow.binding)) {
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
      hyokaKmk: hyokaKmk,
      engineers: updatedEngineerPoint
    };

    setEvaluationEngineer(engineerInfo);
  };

  const lostFocus = () => {
    props.setEvaluationPoint({ EvaluationCompany: evaluationCompany.current, EvaluationEngineer: evaluationEngineer.current });
  };

  const actionOKOverwrapMaster = () => {

    const masterItem = {
      companyItems: [
        { id: 1, name: '施工実績' },
        { id: 2, name: '騒音等' },
        { id: 3, name: '新規技術' },
      ],
      engineerItems: [
        { id: 1, name: '容姿' },
        { id: 2, name: '偏差値' },
        { id: 3, name: '性格' },
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
    props.setEvaluationPoint({ EvaluationCompany: companyInfo, EvaluationEngineer: engineerInfo });
  };

  return (
    <>
      <h2>自社</h2>
      <div>
        <TransposedGrid itemsSource={displayCompanyGrid} autoGenerateRows={false} initialized={initializedCompany} cellEditEnded={cellEditEndedCompany} lostFocus={lostFocus}>
          {
            evaluationCompany.current?.hyokaKmk?.map(kmk => (
              <TransposedGridRow binding={`${kmk.hyokaKmkId}`} header={kmk.hyokaKmkName} dataType="Number" align="center" isRequired={false} />
            ))
          }
        </TransposedGrid>
        <TransposedGrid itemsSource={displayEngineerGrid} autoGenerateRows={false} initialized={initializedEngineer} formatItem={formatItem} cellEditEnded={cellEditEndedEngineer} lostFocus={lostFocus} headersVisibility={evaluationEngineer.current.engineers?.filter((engineer) => engineer.companyId === props.myCompanyId).length === 0 ? wjcGrid.HeadersVisibility.None : wjcGrid.HeadersVisibility.All}>
          {
            evaluationEngineer.current?.hyokaKmk?.map(kmk => (
              <TransposedGridRow binding={`${kmk.hyokaKmkId}`} header={kmk.hyokaKmkName} dataType="Number" align="center" />
            ))
          }
        </TransposedGrid>
      </div>
      <button onClick={() => actionOKOverwrapMaster()}>項目を設定</button>
    </>
  );
};

export default MyCompanyEvaluation;