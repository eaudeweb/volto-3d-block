import { defineMessages } from 'react-intl';

const messages = defineMessages({
  title: {
    id: '3DObjectBlock.title',
    defaultMessage: '3D Object Block',
  },
  fileField: {
    id: '3DObjectBlock.fileField',
    defaultMessage: '3D File',
  },
  description: {
    id: '3DObjectBlock.description',
    defaultMessage: 'Upload an STL or 360 image file.',
  },
  controlsFieldset: {
    id: '3DObjectBlock.controlsFieldset',
    defaultMessage: 'Controls Settings',
  },
  rotationSpeed: {
    id: '3DObjectBlock.rotationSpeed',
    defaultMessage: 'Rotation Speed',
  },
  panSpeed: {
    id: '3DObjectBlock.panSpeed',
    defaultMessage: 'Pan Speed',
  },
  zoomSpeed: {
    id: '3DObjectBlock.zoomSpeed',
    defaultMessage: 'Zoom Speed',
  },
  mouseSpeed: {
    id: '3DObjectBlock.mouseSpeed',
    defaultMessage: 'Mouse Sensitivity',
  },
});

const ThreeDBlockSchema = (intl) => ({
  title: intl.formatMessage(messages.title),
  fieldsets: [
    {
      id: 'default',
      title: 'Default',
      fields: ['file'],
    },
    {
      id: 'controls',
      title: intl.formatMessage(messages.controlsFieldset),
      fields: ['rotationSpeed', 'panSpeed', 'zoomSpeed', 'mouseSpeed'],
    },
  ],
  properties: {
    file: {
      title: intl.formatMessage(messages.fileField),
      description: intl.formatMessage(messages.description),
      widget: 'attachedfile',
    },
    rotationSpeed: {
      title: intl.formatMessage(messages.rotationSpeed),
      type: 'number',
      minimum: 0.001,
      maximum: 0.1,
      step: 0.001,
      default: 0.01,
      description: 'Speed for keyboard rotation controls (0.001 - 0.1)',
    },
    panSpeed: {
      title: intl.formatMessage(messages.panSpeed),
      type: 'number',
      minimum: 0.1,
      maximum: 2.0,
      step: 0.1,
      default: 0.5,
      description: 'Speed for keyboard pan controls (0.1 - 2.0)',
    },
    zoomSpeed: {
      title: intl.formatMessage(messages.zoomSpeed),
      type: 'number',
      minimum: 0.1,
      maximum: 2.0,
      step: 0.1,
      default: 0.5,
      description: 'Speed for keyboard zoom controls (0.1 - 2.0)',
    },
    mouseSpeed: {
      title: intl.formatMessage(messages.mouseSpeed),
      type: 'number',
      minimum: 0.1,
      maximum: 2.0,
      step: 0.1,
      default: 1.0,
      description: 'Mouse sensitivity for orbit controls (0.1 - 2.0)',
    },
  },
  required: ['file'],
});

export default ThreeDBlockSchema;
