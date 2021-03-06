//Importando a interface do req e res do express
import { Request, Response } from 'express';

import db from '../database/connection';
import convertHourToMinutes from '../utils/convertHourToMinutes';

interface ScheduleItem {
  week_day: number;
  from: string;
  to: string;
}

export default class ClassesController {
  // ```````````````````````````````````````````````````````````````````````````````//
  // ```````````````````````````` LIST `````````````````````````````````````````````//
  async index(req: Request, res: Response) {
    const filters = req.query;

    const subject = filters.subject as string;
    const week_day = filters.week_day as string;
    const time = filters.time as string;

    if (!filters.week_day || !filters.subject || !filters.time) {
      return res
        .status(400)
        .json({ error: 'Missing filter to search classes.' });
    }
    // Com o typescript, usar o 'as string' tipa o time em string
    const timeInMinutes = convertHourToMinutes(time);

    const classes = await db('classes')
      // Esta query serve para filtrar o dia da semana e
      // o horário de trabalho. ** ESTUDAR **
      .whereExists(function () {
        this.select('class_schedule.*')
          .from('class_schedule')
          .whereRaw('class_schedule.class_id = classes.id')
          .whereRaw('class_schedule.week_day = ??', [Number(week_day)])
          .whereRaw('class_schedule.from <= ??', [timeInMinutes])
          .whereRaw('class_schedule.to > ??', [timeInMinutes]);
      })
      .where('classes.subject', '=', subject)
      .join('users', 'classes.user_id', '=', 'users.id')
      .select('classes.*', 'users.*');

    return res.json(classes);
  }

  // ```````````````````````````````````````````````````````````````````````````````//
  // `````````````````````````` CREATE `````````````````````````````````````````````//

  async create(req: Request, res: Response) {
    const { name, avatar, whatsapp, bio, subject, cost, schedule } = req.body;

    // Cria uma transaction para executar todos as ações do db em ordem
    // Se alguma ação der errado, nenhuma ação é executada.
    // Precisa de um commit no fim da transação.
    const trx = await db.transaction();

    try {
      // Inserir usuario dentro do DB
      // Retorna um array com usuários inseridos
      const insertedUsersIds = await trx('users')
        .insert({
          name,
          avatar,
          whatsapp,
          bio,
        })
        .returning('id');
      // Pega o primeiro item do array retornado
      // Como é só um usuário inserido, será sempre idx 0
      const user_id = insertedUsersIds[0];

      // Inserir dados da aula no DB
      // Retorna um array com as aulas inseridas
      //user_id é inserido junto (foi capturado em uma const acima)
      const insertedClassesIds = await trx('classes')
        .insert({
          subject,
          cost,
          user_id,
        })
        .returning('id');

      // Pega o primeiro item do array retornado
      // Como é só uma aula inserida, será sempre idx 0
      const class_id = insertedClassesIds[0];

      // Transformar os horários de agendamento de String de hora para Minutos
      // Faz um map dentro da array 'schedule' e retorna um novo objeto
      const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
        return {
          class_id,
          week_day: scheduleItem.week_day,
          // Para os horários, executa a função auxiliar de conversão
          // criada na pasta 'utils' da aplicação
          from: convertHourToMinutes(scheduleItem.from),
          to: convertHourToMinutes(scheduleItem.to),
        };
      });

      // Cria o DB com os agendamentos já convertidos em minutos
      // na variável 'classSchedule' (que é um arr de objs)
      await trx('class_schedule').insert(classSchedule);

      // Commitar a transação
      await trx.commit();

      return res.status(201).send();
    } catch (err) {
      // Caso haja algum erro, esse comando desfaz as transações
      // que eventualmente tenham acontecido até o erro.
      await trx.rollback();

      // tratamento do erro padrão
      console.log(err.message);
      return res
        .status(400)
        .json({ message: 'Unexpected error while creating new class' });
    }
  }
}
