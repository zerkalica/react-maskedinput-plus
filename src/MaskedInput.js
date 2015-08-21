import {getSelection, setSelection} from 'react/lib/ReactInputSelection'
import InputMask from 'inputmask-core'
import React from 'react'

const {
    object,
    string
} = React.PropTypes

const KEYCODE_Z = 90
const KEYCODE_Y = 89

function isUndo(e) {
    return (e.ctrlKey || e.metaKey) && e.keyCode === (e.shiftKey ? KEYCODE_Y : KEYCODE_Z)
}

function isRedo(e) {
    return (e.ctrlKey || e.metaKey) && e.keyCode === (e.shiftKey ? KEYCODE_Z : KEYCODE_Y)
}

export default class MaskedInput extends React.Component {
    static propTypes = {
        formatCharacters: object,
        pattern: string.isRequired,
        placeholderChar: string,
        nonDataMask: string
    }

    constructor(props, context) {
        super(props, context)
        this._getDisplayValue = ::this._getDisplayValue
        this._onChange = ::this._onChange
        this._onKeyDown = ::this._onKeyDown
        this._onKeyPress = ::this._onKeyPress
        this._onPaste = ::this._onPaste
        this._updateInputSelection = ::this._updateInputSelection
        this._updateMaskSelection = ::this._updateMaskSelection
        this._format = ::this._format

        this._nonDataRegExp = new RegExp(props.nonDataMask || '[ ]+', 'g')
    }

    getDefaultProps() {
        return {
            value: '',
            format: p => p
        }
    }

    componentWillMount() {
        const options = {
            pattern: this.props.pattern,
            value: this._format(this._cleanValue(this.props.value)),
            formatCharacters: this.props.formatCharacters
        }

        if (this.props.placeholderChar) {
            options.placeholderChar = this.props.placeholderChar
        }

        this.mask = new InputMask(options)
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.pattern !== nextProps.pattern) {
            this.mask.setPattern(nextProps.pattern, {
                value: this.mask.getRawValue()
            })
        }
    }

    render() {
        const {pattern, formatCharacters, size, placeholder, ...props} = this.props
        const patternLength = this.mask.pattern.length

        return (
            <input {...props}
                maxLength={patternLength}
                onChange={this._onChange}
                onKeyDown={this._onKeyDown}
                onKeyPress={this._onKeyPress}
                onPaste={this._onPaste}
                placeholder={placeholder || this.mask.emptyValue}
                size={size || patternLength}
                value={this._getDisplayValue()}
            />
        )
    }

    _getDOMNode() {
        return React.findDOMNode(this)
    }

    _cleanValue(value) {
        return value.replace(this._nonDataRegExp, '')
    }

    _format(formattedValue) {
        const {pattern} = this.props
        let result = ''
        for (let i = 0, j = 0; i < pattern.length && j < formattedValue.length; i++) {
            const ch = pattern[i]
            if (this._nonDataRegExp.test(ch)) {
                result += ch
            } else {
                result += formattedValue[j]
                j++
            }
        }

        return result
    }

    _updateInputSelection() {
        setSelection(this._getDOMNode(), this.mask.selection)
    }

    _updateMaskSelection() {
        this.mask.selection = getSelection(this._getDOMNode())
    }

    _onChange(e) {
        const maskValue = this.mask.getValue()
        if (e.target.value !== maskValue) {
            // Cut or delete operations will have shortened the value
            if (e.target.value.length < maskValue.length) {
                const sizeDiff = maskValue.length - e.target.value.length
                this._updateMaskSelection()
                this.mask.selection.end = this.mask.selection.start + sizeDiff
                this.mask.backspace()
            }
            const value = this._getDisplayValue()
            e.target.value = value
            if (value) {
                this._updateInputSelection()
            }
        }

        if (this.props.onChange) {
            this.props.onChange(e)
        }
    }

    _onKeyDown(e) {
        if (isUndo(e)) {
            e.preventDefault()
            if (this.mask.undo()) {
                e.target.value = this._getDisplayValue()
                this._updateInputSelection()
                this.props.onChange(e)
            }
            return
        } else if (isRedo(e)) {
            e.preventDefault()
            if (this.mask.redo()) {
                e.target.value = this._getDisplayValue()
                this._updateInputSelection()
                this.props.onChange(e)
            }
            return
        }

        if (e.key === 'Backspace') {
            e.preventDefault()
            this._updateMaskSelection()
            if (this.mask.backspace()) {
                const value = this._getDisplayValue()
                e.target.value = value
                if (value) {
                    this._updateInputSelection()
                }
                this.props.onChange(e)
            }
        }
    }

    _onKeyPress(e) {
        // console.log('onKeyPress', JSON.stringify(getSelection(this._getDOMNode())), e.key, e.target.value)

        // Ignore modified key presses
        if (e.metaKey || e.altKey || e.ctrlKey) {
            return
        }

        e.preventDefault()
        this._updateMaskSelection()
        if (this.mask.input(e.key)) {
            e.target.value = this.mask.getValue()
            this._updateInputSelection()
            this.props.onChange(e)
        }
    }

    _onPaste(e) {
        e.preventDefault()
        this._updateMaskSelection()
        // getData value needed for IE also works in FF & Chrome
        const value = this._cleanValue(e.clipboardData.getData('Text'))
        if (this.props.validate(value) && this.mask.paste(this._format(value))) {
            e.target.value = this.mask.getValue()
            // Timeout needed for IE
            setTimeout(this._updateInputSelection, 0)
            this.props.onChange(e)
        }
    }

    _getDisplayValue() {
        const value = this.mask.getValue()
        return value === this.mask.emptyValue ? '' : value
    }
}
