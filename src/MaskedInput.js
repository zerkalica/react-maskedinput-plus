import {getSelection, setSelection} from 'react/lib/ReactInputSelection'
import InputMask from 'inputmask-core'
import React from 'react'

const {
    object,
    string,
    func
} = React.PropTypes

const KEYCODE_Z = 90
const KEYCODE_Y = 89

function isUndo(e) {
    return (e.ctrlKey || e.metaKey) && e.keyCode === (e.shiftKey ? KEYCODE_Y : KEYCODE_Z)
}

function isRedo(e) {
    return (e.ctrlKey || e.metaKey) && e.keyCode === (e.shiftKey ? KEYCODE_Z : KEYCODE_Y)
}

function pass(p) {
    return p
}


export default class MaskedInput extends React.Component {
    static propTypes = {
        formatCharacters: object,
        pattern: string.isRequired,
        placeholderChar: string,
        nonDataMask: string,
        validate: func,
        onKeyPress: func,
        onChange: func,
        onChangeValue: func
    }

    static defaultProps = {
        value: '',
        format: pass,
        placeholderChar: '_',
        validate: v => true,
        onChange: pass,
        onKeyDown: pass,
        onChangeValue: pass
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

    componentWillMount() {
        const {
            pattern,
            formatCharacters,
            placeholderChar,
            value
        } = this.props

        this.mask = new InputMask({
            pattern,
            formatCharacters,
            placeholderChar,
            value: this._format(this._cleanValue(value))
        })
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
        const {onChange} = this.props
        const {mask} = this
        const maskValue = mask.getValue()
        if (e.target.value !== maskValue) {
            // Cut or delete operations will have shortened the value
            if (e.target.value.length < maskValue.length) {
                const sizeDiff = maskValue.length - e.target.value.length
                this._updateMaskSelection()
                mask.selection.end = mask.selection.start + sizeDiff
                mask.backspace()
            }
            const value = this._getDisplayValue()
            e.target.value = value
            if (value) {
                this._updateInputSelection()
            }
        }

        onChange(e)
    }

    _onKeyDown(e) {
        const {onKeyDown, onChange} = this.props
        const {mask} = this
        if (isUndo(e)) {
            e.preventDefault()
            if (mask.undo()) {
                e.target.value = this._getDisplayValue()
                this._updateInputSelection()
                onChange(e)
            }
            return
        } else if (isRedo(e)) {
            e.preventDefault()
            if (mask.redo()) {
                e.target.value = this._getDisplayValue()
                this._updateInputSelection()
                onChange(e)
            }
            return
        }

        if (e.key === 'Backspace') {
            e.preventDefault()
            this._updateMaskSelection()
            if (mask.backspace()) {
                const value = this._getDisplayValue()
                e.target.value = value
                if (value) {
                    this._updateInputSelection()
                }
                onChange(e)
            }
        }
        onKeyDown(e)
    }

    _onKeyPress(e) {
        const {onChange, onChangeValue} = this.props
        const {mask} = this
        // Ignore modified key presses
        if (e.metaKey || e.altKey || e.ctrlKey) {
            return
        }

        e.preventDefault()
        this._updateMaskSelection()
        if (mask.input(e.key)) {
            e.target.value = mask.getValue()
            this._updateInputSelection()
            onChange(e)
            onChangeValue(this._cleanValue(e.target.value))
        }
    }

    _onPaste(e) {
        const {validate, onChange, onChangeValue} = this.props
        const {mask} = this
        e.preventDefault()
        this._updateMaskSelection()
        // getData value needed for IE also works in FF & Chrome
        const value = this._cleanValue(e.clipboardData.getData('Text'))
        if (validate(value) && mask.paste(this._format(value))) {
            e.target.value = mask.getValue()
            // Timeout needed for IE
            setTimeout(this._updateInputSelection, 0)
            onChange(e)
            onChangeValue(this._cleanValue(e.target.value))
        }
    }

    _getDisplayValue() {
        const {mask} = this
        const value = mask.getValue()
        return value === mask.emptyValue ? '' : value
    }
}
