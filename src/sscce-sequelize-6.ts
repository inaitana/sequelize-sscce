import { DataTypes, Model } from 'sequelize';
import { createSequelize6Instance } from '../setup/create-sequelize-instance';
import { expect } from 'chai';
import sinon from 'sinon';

// if your issue is dialect specific, remove the dialects you don't need to test on.
export const testingOnDialects = new Set(['mssql', 'sqlite', 'mysql', 'mariadb', 'postgres', 'postgres-native']);

// You can delete this file if you don't want your SSCCE to be tested against Sequelize 6

// Your SSCCE goes inside this function.
export async function run() {
  // This function should be used instead of `new Sequelize()`.
  // It applies the config for your SSCCE to work on CI.
  const sequelize = createSequelize6Instance({
    logQueryParameters: true,
    benchmark: true,
    define: {
      // For less clutter in the SSCCE
      timestamps: false,
    },
  });


  class Task extends Model {}

  Task.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    projectId: {
      type: DataTypes.INTEGER
    },
    type: {
      type: DataTypes.INTEGER
    }
  }, {
    sequelize,
    defaultScope: {
      where: {
        type: 1
      }
    }
  });

  Task.addScope("typetwo", {
    where: {
      type: 2
    }
  });

  class Project extends Model {}

  Project.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    }
  }, {
    sequelize
  });


  Project.hasMany(Task, { foreignKey: "projectId" });

  // You can use sinon and chai assertions directly in your SSCCE.
  const spy = sinon.spy();
  sequelize.afterBulkSync(() => spy());
  await sequelize.sync({ force: true });
  expect(spy).to.have.been.called;

  await Project.findOrCreate({ where: { id: 1 } });
  await Task.findOrCreate({ where: { id: 1 }, defaults: { projectId: 1, type: 1 } });
  await Task.unscoped().findOrCreate({ where: { id: 2 }, defaults: { projectId: 1, type: 2 } });
  await Task.unscoped().findOrCreate({ where: { id: 3 }, defaults: { projectId: 1, type: 3 } });
  expect(await Project.count()).to.equal(1);
  expect(await Task.count()).to.equal(1);
  expect(await Task.unscoped().count()).to.equal(3);

  await Project.findAll({
    include: {
      model: Task
    }
  }).then(projects => {
    console.log('#1')
    expect(projects.length, '#1').to.equal(1);
    expect(projects[0].get().Tasks.length, '#1').to.equal(1);
  });

  await Project.findAll({
    include: {
      model: Task.unscoped()
    }
  }).then(projects => {
    console.log('#2')
    expect(projects.length, '#2').to.equal(1);
    expect(projects[0].get().Tasks.length, '#2').to.equal(3);
  });

  await Project.findAll({
    include: {
      model: Task.scope("typetwo")
    }
  }).then(projects => {
    console.log('#3')
    expect(projects.length, '#3').to.equal(1);
    expect(projects[0].get().Tasks.length, '#3').to.equal(1);
  });

  await Project.findAll({
    include: {
      model: Task,
      separate: true
    }
  }).then(projects => {
    console.log('#4')
    expect(projects.length, '#4').to.equal(1);
    expect(projects[0].get().Tasks.length, '#4').to.equal(1);
  });

  // #5
  await Project.findAll({
    include: {
      model: Task.unscoped(),
      separate: true
    }
  }).then(projects => {
    expect(projects.length).to.equal(1, '#5');
    expect(projects[0].get().Tasks.length).to.equal(3, '#5');
  });

  // #6
  await Project.findAll({
    include: {
      model: Task.scope("typetwo"),
      separate: true
    }
  }).then(projects => {
    expect(projects.length, '#6').to.equal(1);
    expect(projects[0].get().Tasks.length, '#6').to.equal(1);
  });
}
